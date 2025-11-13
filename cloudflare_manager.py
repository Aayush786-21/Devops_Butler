"""Utilities for managing Cloudflare Tunnel ingress rules and DNS records."""

from __future__ import annotations

import os
from typing import Dict, List, Optional

import httpx


class CloudflareError(Exception):
    """Raised when Cloudflare API operations fail."""


API_BASE = "https://api.cloudflare.com/client/v4"


def _get_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise CloudflareError(f"Missing required environment variable: {name}")
    return value


def _auth_headers(token: str) -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


def _request(method: str, url: str, token: str, json: Optional[Dict] = None) -> Dict:
    with httpx.Client(timeout=15.0) as client:
        response = client.request(method, url, headers=_auth_headers(token), json=json)
    try:
        data = response.json()
    except ValueError as exc:  # pragma: no cover - defensive
        raise CloudflareError(f"Cloudflare API returned non-JSON response (status {response.status_code})") from exc

    if not data.get("success", False):
        errors = data.get("errors") or []
        first_error = errors[0] if errors else {}
        message = first_error.get("message") or str(errors) or "Unknown Cloudflare API error"
        raise CloudflareError(message)
    return data


def _get_tunnel_config(account_id: str, tunnel_id: str, token: str) -> Dict:
    url = f"{API_BASE}/accounts/{account_id}/cfd_tunnel/{tunnel_id}/configurations"
    data = _request("GET", url, token)
    return data.get("result", {}).get("config", {})


def _update_tunnel_config(account_id: str, tunnel_id: str, token: str, config: Dict) -> None:
    url = f"{API_BASE}/accounts/{account_id}/cfd_tunnel/{tunnel_id}/configurations"
    _request("PUT", url, token, json={"config": config})


def _ensure_fallback_rule(ingress: List[Dict]) -> List[Dict]:
    """Guarantee that an http_status fallback exists as the last rule."""
    fallback_rules = [rule for rule in ingress if not rule.get("hostname")]
    non_fallback = [rule for rule in ingress if rule.get("hostname")]
    if fallback_rules:
        # Keep the first fallback, drop extra ones to avoid duplicates.
        return non_fallback + [fallback_rules[0]]
    return non_fallback + [{"service": "http_status:404"}]


def _build_service_entry(hostname: str, service_url: str, origin_request: Optional[Dict] = None) -> Dict:
    # Force HTTP for Cloudflare Tunnel - Cloudflare handles SSL termination at the edge
    # Convert any HTTPS URLs to HTTP to avoid SSL cipher mismatch errors
    if service_url.startswith("https://"):
        service_url = service_url.replace("https://", "http://", 1)
    
    entry: Dict[str, object] = {"hostname": hostname, "service": service_url}
    if origin_request is None:
        origin_request = {}
    # Ensure noSSLVerify is set to handle any SSL issues
    origin_request.setdefault("noTLSVerify", False)
    entry["originRequest"] = origin_request
    return entry


def _ingress_without_host(ingress: List[Dict], hostname: str) -> List[Dict]:
    return [rule for rule in ingress if rule.get("hostname") != hostname]


def _upsert_dns_record(zone_id: str, tunnel_id: str, hostname: str, token: str) -> None:
    target = f"{tunnel_id}.cfargotunnel.com"
    list_url = f"{API_BASE}/zones/{zone_id}/dns_records?type=CNAME&name={hostname}"
    data = _request("GET", list_url, token)
    records = data.get("result", [])

    payload = {
        "type": "CNAME",
        "name": hostname,
        "content": target,
        "proxied": True,
        "ttl": 1,
    }

    if records:
        record_id = records[0]["id"]
        update_url = f"{API_BASE}/zones/{zone_id}/dns_records/{record_id}"
        _request("PUT", update_url, token, json=payload)
    else:
        create_url = f"{API_BASE}/zones/{zone_id}/dns_records"
        _request("POST", create_url, token, json=payload)


def _delete_dns_record(zone_id: str, hostname: str, token: str) -> None:
    list_url = f"{API_BASE}/zones/{zone_id}/dns_records?type=CNAME&name={hostname}"
    data = _request("GET", list_url, token)
    records = data.get("result", [])
    for record in records:
        delete_url = f"{API_BASE}/zones/{zone_id}/dns_records/{record['id']}"
        _request("DELETE", delete_url, token)


def ensure_project_hostname(hostname: str, service_url: str) -> None:
    """Create or update Cloudflare ingress + DNS so the hostname routes to the service URL."""
    
    # Force HTTP for Cloudflare Tunnel - Cloudflare handles SSL termination at the edge
    # This prevents SSL_ERROR_NO_CYPHER_OVERLAP errors
    if service_url.startswith("https://"):
        service_url = service_url.replace("https://", "http://", 1)

    account_id = _get_env("CLOUDFLARE_ACCOUNT_ID")
    tunnel_id = _get_env("CLOUDFLARE_TUNNEL_ID")
    zone_id = _get_env("CLOUDFLARE_ZONE_ID")
    token = _get_env("CLOUDFLARE_API_TOKEN")

    config = _get_tunnel_config(account_id, tunnel_id, token)
    ingress = config.get("ingress", [])

    # Preserve existing order but remove the hostname if present.
    ingress_without_host = _ingress_without_host(ingress, hostname)

    # Find the index of the first wildcard hostname to insert before it for higher priority.
    insert_index = len(ingress_without_host)
    for idx, rule in enumerate(ingress_without_host):
        host = rule.get("hostname") or ""
        if "*" in host:
            insert_index = idx
            break

    new_entry = _build_service_entry(hostname, service_url)
    ingress_without_host.insert(insert_index, new_entry)

    config["ingress"] = _ensure_fallback_rule(ingress_without_host)
    _update_tunnel_config(account_id, tunnel_id, token, config)

    # Ensure DNS CNAME exists for the hostname.
    _upsert_dns_record(zone_id, tunnel_id, hostname, token)


def remove_project_hostname(hostname: str) -> None:
    """Remove Cloudflare ingress + DNS for the provided hostname."""

    account_id = _get_env("CLOUDFLARE_ACCOUNT_ID")
    tunnel_id = _get_env("CLOUDFLARE_TUNNEL_ID")
    zone_id = _get_env("CLOUDFLARE_ZONE_ID")
    token = _get_env("CLOUDFLARE_API_TOKEN")

    config = _get_tunnel_config(account_id, tunnel_id, token)
    ingress = config.get("ingress", [])

    updated_ingress = _ensure_fallback_rule(_ingress_without_host(ingress, hostname))
    config["ingress"] = updated_ingress
    _update_tunnel_config(account_id, tunnel_id, token, config)

    _delete_dns_record(zone_id, hostname, token)

