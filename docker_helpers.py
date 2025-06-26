def get_host_port(container_details: dict):

    try:
        ports = container_details.get("NetworkSettings", {}).get("Ports", {})
        for container_port, host_bindings in ports.items():
            if host_bindings and len(host_bindings) > 0:
                return host_bindings[0].get("HostPort")
        return None
    except (KeyError, IndexError, TypeError):
        return None 