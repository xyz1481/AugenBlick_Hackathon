import sys
import json
import networkx as nx

def build_global_graph():
    G = nx.DiGraph()
    
    systems = [
        "geopolitical_event",
        "energy_supply",
        "trade_routes",
        "logistics_network",
        "commodity_markets",
        "regional_economy"
    ]
    
    edges = [
        ("geopolitical_event", "trade_routes"),
        ("geopolitical_event", "energy_supply"),
        ("trade_routes", "logistics_network"),
        ("energy_supply", "commodity_markets"),
        ("logistics_network", "commodity_markets"),
        ("commodity_markets", "regional_economy")
    ]
    
    G.add_nodes_from(systems)
    G.add_edges_from(edges)
    return G

def classify_event(query):
    query_lower = query.lower()
    
    # Simple keyword-based classification
    if any(k in query_lower for k in ["attack", "conflict", "war", "missile", "strike"]):
        return "military_conflict"
    if any(k in query_lower for k in ["blockade", "closure", "stuck", "obstruct"]):
        return "port_blockade"
    if any(k in query_lower for k in ["sanction", "ban", "embargo"]):
        return "trade_sanction"
    if any(k in query_lower for k in ["pipeline", "gas", "oil", "leak"]):
        return "pipeline_attack"
        
    return "general_geopolitical_event"

def get_impacted_chain(query):
    G = build_global_graph()
    event_type = classify_event(query)
    
    # Mapping event type to initial affected systems
    event_impact_map = {
        "military_conflict": ["trade_routes", "energy_supply"],
        "trade_sanction": ["commodity_markets", "trade_routes"],
        "pipeline_attack": ["energy_supply"],
        "port_blockade": ["trade_routes", "logistics_network"],
        "general_geopolitical_event": ["geopolitical_event"]
    }
    
    start_nodes = event_impact_map.get(event_type, ["geopolitical_event"])
    
    impacted_nodes = set()
    for start_node in start_nodes:
        impacted_nodes.add(start_node)
        # Propagate through descendants
        impacted_nodes.update(nx.descendants(G, start_node))
    
    # Preserve hierarchy/flow for visualization
    # We'll return nodes in a topological-ish order if they exist in the impacted set
    ordered_systems = [
        "geopolitical_event",
        "energy_supply",
        "trade_routes",
        "logistics_network",
        "commodity_markets",
        "regional_economy"
    ]
    
    chain = [node for node in ordered_systems if node in impacted_nodes]
    
    # Map back to user-friendly labels
    labels = {
        "geopolitical_event": "Geopolitical Event",
        "energy_supply": "Energy Supply Chain",
        "trade_routes": "Global Trade Routes",
        "logistics_network": "Logistics & Maritime Network",
        "commodity_markets": "Commodity Markets",
        "regional_economy": "Regional Economic Stability"
    }
    
    # Context-aware descriptions
    descriptions = {
        "geopolitical_event": f"Initial {event_type.replace('_', ' ')} detected in the region, triggering systemic risk alerts.",
        "energy_supply": "Potential disruptions to oil/gas extraction and pipeline transit causing supply-side shocks.",
        "trade_routes": "Maritime corridors and transit routes experiencing high stress or forced rerouting.",
        "logistics_network": "Port congestion increases and shipping delays propagate through the logistics chain.",
        "commodity_markets": "Volatility spikes in key raw materials and energy benchmarks due to supply uncertainty.",
        "regional_economy": "Broad economic impact affecting inflation, consumer confidence, and GDP growth in affected zones."
    }
    
    result = {
        "event_type": event_type,
        "nodes": [
            {
                "id": n, 
                "label": labels[n], 
                "type": n, 
                "description": descriptions[n]
            } for n in chain
        ],
        "edges": [{"from": u, "to": v} for u, v in G.edges() if u in impacted_nodes and v in impacted_nodes],
        "summary": f"Detected {event_type.replace('_', ' ')}: Cascading impact detected across {len(chain)} system layers."
    }
    
    return result

if __name__ == "__main__":
    user_query = sys.argv[1] if len(sys.argv) > 1 else "Global event"
    try:
        output = get_impacted_chain(user_query)
        print(json.dumps(output))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
