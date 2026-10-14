
import heapq
import math

# --------------------------------------------------
# Graph creation
# --------------------------------------------------

def build_grid_graph(rows=6, cols=6, blocked=None):
    """Build a sample road network for route planning."""
    blocked = set(blocked or [])
    graph = {}

    for r in range(rows):
        for c in range(cols):
            node = (r, c)

            if node in blocked:
                continue

            graph[node] = []

            for dr, dc in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
                nr, nc = r + dr, c + dc
                neighbor = (nr, nc)

                if (
                    0 <= nr < rows
                    and 0 <= nc < cols
                    and neighbor not in blocked
                ):
                    graph[node].append(neighbor)

    return graph


# --------------------------------------------------
# 1. IDDFS
# --------------------------------------------------

def depth_limited_search(graph, current, goal, depth, path):
    if current == goal:
        return path[:]

    if depth == 0:
        return None

    for neighbor in graph.get(current, []):
        if neighbor not in path:
            path.append(neighbor)

            result = depth_limited_search(
                graph, neighbor, goal, depth - 1, path
            )

            if result:
                return result

            path.pop()

    return None


def iddfs(graph, start, goal, max_depth=40):
    """Find a path by gradually increasing the search depth."""
    if start not in graph or goal not in graph:
        return None

    if start == goal:
        return [start]

    for depth in range(max_depth + 1):
        result = depth_limited_search(
            graph, start, goal, depth, [start]
        )

        if result:
            return result

    return None


# --------------------------------------------------
# 2. Heuristic evaluation
# --------------------------------------------------

def evaluate_route(path, hazards=None, crowd=None):
    """
    Lower score is better.
    Scores account for distance, hazard exposure and crowding.
    """
    hazards = hazards or {}
    crowd = crowd or {}

    distance = max(0, len(path) - 1)
    hazard_score = sum(hazards.get(node, 0) for node in path)
    crowd_score = sum(crowd.get(node, 0) for node in path)

    total = (
        distance * 1.0
        + hazard_score * 10.0
        + crowd_score * 2.0
    )

    return {
        "distance": distance,
        "hazard": round(hazard_score, 2),
        "crowd": round(crowd_score, 2),
        "score": round(total, 2)
    }


# --------------------------------------------------
# 3. Hill climbing
# --------------------------------------------------

def hill_climbing(graph, start, goal, hazards=None, crowd=None):
    """
    Repeatedly move to the best-scoring neighboring node.
    Avoids revisiting nodes and returns a candidate route.
    """
    hazards = hazards or {}
    crowd = crowd or {}

    if start not in graph or goal not in graph:
        return None

    current = start
    path = [current]
    visited = {current}
    max_steps = len(graph)

    for _ in range(max_steps):
        if current == goal:
            return path

        candidates = []

        for neighbor in graph.get(current, []):
            if neighbor in visited:
                continue

            # Prefer nodes closer to the destination,
            # with lower hazard and crowd penalties.
            heuristic = (
                math.dist(neighbor, goal)
                + hazards.get(neighbor, 0) * 10
                + crowd.get(neighbor, 0) * 2
            )

            candidates.append((heuristic, neighbor))

        if not candidates:
            return None

        candidates.sort(key=lambda item: item[0])
        _, next_node = candidates[0]

        current = next_node
        path.append(current)
        visited.add(current)

    return None


# --------------------------------------------------
# 4. Safety constraint checking
# --------------------------------------------------

def is_route_safe(path, blocked=None, critical=None):
    """Reject routes passing through blocked or critical nodes."""
    blocked = set(blocked or [])
    critical = set(critical or [])

    if not path:
        return False

    for node in path:
        if node in blocked or node in critical:
            return False

    return True


# --------------------------------------------------
# Complete route planner
# --------------------------------------------------

def plan_routes(start, goal, blocked=None, critical=None,
                hazards=None, crowd=None):
    blocked = set(blocked or [])
    critical = set(critical or [])

    graph = build_grid_graph(blocked=blocked)

    candidates = []

    # IDDFS candidate
    route = iddfs(graph, start, goal)

    if route and is_route_safe(route, blocked, critical):
        candidates.append(("IDDFS", route))

    # Hill-climbing candidate
    route = hill_climbing(
        graph, start, goal, hazards, crowd
    )

    if route and is_route_safe(route, blocked, critical):
        candidates.append(("Hill Climbing", route))

    # Deduplicate routes
    unique = {}
    for algorithm, path in candidates:
        key = tuple(path)
        if key not in unique:
            unique[key] = {
                "algorithm": algorithm,
                "path": path,
                **evaluate_route(path, hazards, crowd)
            }

    results = sorted(
        unique.values(),
        key=lambda item: item["score"]
    )

    return {
        "routes": results,
        "recommended": results[0] if results else None
    }
