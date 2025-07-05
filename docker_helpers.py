def get_host_port(container_details: dict):

    try:
        ports = container_details.get("NetworkSettings", {}).get("Ports", {})
        for container_port, host_bindings in ports.items():
            if host_bindings and len(host_bindings) > 0:
                return host_bindings[0].get("HostPort")
        return None
    except (KeyError, IndexError, TypeError):
        return None 

def get_container_port(container_details: dict):
    """
    Parses the inspect output to find the first internal container port.
    """
    try:
        # The structure is NetworkSettings -> Ports -> "container_port/tcp"
        ports = container_details.get("NetworkSettings", {}).get("Ports", {})
        if ports:
            # The key of the first item in the ports dictionary is the "port/protocol" string
            internal_port_string = list(ports.keys())[0]
            # Split '8000/tcp' to get just '8000'
            return internal_port_string.split('/')[0]
        return None
    except (KeyError, IndexError, TypeError):
        return None 