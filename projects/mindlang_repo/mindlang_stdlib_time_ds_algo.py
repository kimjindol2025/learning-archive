#!/usr/bin/env python3
"""
MindLang 표준 라이브러리 - Phase 4: 시간/데이터구조/알고리즘
28개 필수 함수 구현 (외부 의존성 없음)

함수:
├─ 시간 & 날짜 (8개)
│  ├─ now()         - 현재 시간
│  ├─ today()       - 현재 날짜
│  ├─ timestamp()   - 타임스탬프
│  ├─ sleep()       - 일시 중지
│  ├─ time_diff()   - 시간 차이
│  ├─ format_time() - 시간 포맷팅
│  ├─ parse_time()  - 시간 파싱
│  └─ add_days()    - 날짜 더하기
├─ 데이터 구조 (10개)
│  ├─ Stack        - 스택
│  ├─ Queue        - 큐
│  ├─ LinkedList   - 연결 리스트
│  ├─ Tree         - 트리
│  ├─ Graph        - 그래프
│  ├─ HashSet      - 해시 집합
│  ├─ HashTable    - 해시 테이블
│  ├─ Heap         - 힙
│  ├─ Trie         - 트라이
│  └─ PriorityQueue- 우선순위 큐
└─ 알고리즘 (10개)
   ├─ binary_search()    - 이진 탐색
   ├─ bubble_sort()      - 거품 정렬
   ├─ quick_sort()       - 퀵 정렬
   ├─ merge_sort()       - 병합 정렬
   ├─ dfs()              - 깊이 우선 탐색
   ├─ bfs()              - 너비 우선 탐색
   ├─ dijkstra()         - 다익스트라
   ├─ floyd_warshall()   - 플로이드-워셜
   ├─ topological_sort() - 위상 정렬
   └─ find_gcd_pair()    - GCD 쌍 찾기
"""

import time

# ============= 시간 & 날짜 함수 =============

class MindLangTime:
    """MindLang 시간 & 날짜 유틸리티"""

    @staticmethod
    def now():
        """현재 시간 (초 단위 타임스탬프)"""
        return time.time()

    @staticmethod
    def today():
        """현재 날짜 (YYYY-MM-DD 형식 문자열)"""
        import time
        struct_time = time.localtime()
        year = struct_time.tm_year
        month = struct_time.tm_mon
        day = struct_time.tm_mday
        return f"{year:04d}-{month:02d}-{day:02d}"

    @staticmethod
    def timestamp():
        """타임스탬프 (초 단위 정수)"""
        return int(time.time())

    @staticmethod
    def sleep(seconds):
        """일시 중지"""
        if not isinstance(seconds, (int, float)):
            raise TypeError(f"초는 숫자: {type(seconds)}")
        if seconds < 0:
            raise ValueError(f"음수 초: {seconds}")

        time.sleep(seconds)

    @staticmethod
    def time_diff(start_time, end_time):
        """시간 차이 (초 단위)"""
        if not isinstance(start_time, (int, float)) or not isinstance(end_time, (int, float)):
            raise TypeError("타임스탬프는 숫자")

        return end_time - start_time

    @staticmethod
    def format_time(timestamp, fmt="%Y-%m-%d %H:%M:%S"):
        """시간 포맷팅"""
        if not isinstance(timestamp, (int, float)):
            raise TypeError(f"타임스탬프는 숫자: {type(timestamp)}")

        struct_time = time.localtime(timestamp)
        year = struct_time.tm_year
        month = struct_time.tm_mon
        day = struct_time.tm_mday
        hour = struct_time.tm_hour
        minute = struct_time.tm_min
        second = struct_time.tm_sec

        # 간단한 포맷팅
        if fmt == "%Y-%m-%d %H:%M:%S":
            return f"{year:04d}-{month:02d}-{day:02d} {hour:02d}:{minute:02d}:{second:02d}"
        elif fmt == "%Y-%m-%d":
            return f"{year:04d}-{month:02d}-{day:02d}"
        elif fmt == "%H:%M:%S":
            return f"{hour:02d}:{minute:02d}:{second:02d}"
        else:
            return str(timestamp)

    @staticmethod
    def parse_time(time_str):
        """시간 파싱 (YYYY-MM-DD HH:MM:SS -> timestamp)"""
        if not isinstance(time_str, str):
            raise TypeError(f"문자열이 필요함: {type(time_str)}")

        # 간단한 파싱: "YYYY-MM-DD HH:MM:SS"
        parts = time_str.split(" ")
        if len(parts) != 2:
            raise ValueError(f"유효한 형식: YYYY-MM-DD HH:MM:SS")

        date_part = parts[0].split("-")
        time_part = parts[1].split(":")

        if len(date_part) != 3 or len(time_part) != 3:
            raise ValueError(f"유효한 형식: YYYY-MM-DD HH:MM:SS")

        year, month, day = int(date_part[0]), int(date_part[1]), int(date_part[2])
        hour, minute, second = int(time_part[0]), int(time_part[1]), int(time_part[2])

        # timestamp로 변환 (간단한 구현)
        # 1970-01-01부터 경과 일수 계산
        days = 0
        for y in range(1970, year):
            days += 366 if (y % 4 == 0 and y % 100 != 0) or (y % 400 == 0) else 365

        days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
        if (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0):
            days_in_month[1] = 29

        for m in range(1, month):
            days += days_in_month[m - 1]

        days += day - 1

        total_seconds = days * 86400 + hour * 3600 + minute * 60 + second
        return total_seconds

    @staticmethod
    def add_days(timestamp, days):
        """날짜 더하기"""
        if not isinstance(timestamp, (int, float)):
            raise TypeError(f"타임스탬프는 숫자: {type(timestamp)}")
        if not isinstance(days, int):
            raise TypeError(f"날짜는 정수: {type(days)}")

        return timestamp + (days * 86400)


# ============= 데이터 구조 =============

class Stack:
    """스택 (LIFO)"""

    def __init__(self):
        self.items = []

    def push(self, item):
        """요소 추가"""
        self.items.append(item)

    def pop(self):
        """요소 제거"""
        if len(self.items) == 0:
            raise IndexError("빈 스택")
        return self.items.pop()

    def peek(self):
        """최상위 요소 확인"""
        if len(self.items) == 0:
            raise IndexError("빈 스택")
        return self.items[-1]

    def is_empty(self):
        """공집합 확인"""
        return len(self.items) == 0

    def size(self):
        """크기"""
        return len(self.items)


class Queue:
    """큐 (FIFO)"""

    def __init__(self):
        self.items = []

    def enqueue(self, item):
        """요소 추가"""
        self.items.append(item)

    def dequeue(self):
        """요소 제거"""
        if len(self.items) == 0:
            raise IndexError("빈 큐")
        return self.items.pop(0)

    def peek(self):
        """앞 요소 확인"""
        if len(self.items) == 0:
            raise IndexError("빈 큐")
        return self.items[0]

    def is_empty(self):
        """공집합 확인"""
        return len(self.items) == 0

    def size(self):
        """크기"""
        return len(self.items)


class LinkedListNode:
    """연결 리스트 노드"""

    def __init__(self, data):
        self.data = data
        self.next = None


class LinkedList:
    """연결 리스트"""

    def __init__(self):
        self.head = None

    def append(self, data):
        """끝에 추가"""
        node = LinkedListNode(data)
        if self.head is None:
            self.head = node
            return

        current = self.head
        while current.next:
            current = current.next
        current.next = node

    def remove(self, data):
        """요소 제거"""
        if self.head is None:
            return

        if self.head.data == data:
            self.head = self.head.next
            return

        current = self.head
        while current.next:
            if current.next.data == data:
                current.next = current.next.next
                return
            current = current.next

    def to_list(self):
        """리스트로 변환"""
        result = []
        current = self.head
        while current:
            result.append(current.data)
            current = current.next
        return result


class TreeNode:
    """트리 노드"""

    def __init__(self, data):
        self.data = data
        self.children = []

    def add_child(self, child):
        """자식 노드 추가"""
        self.children.append(child)


class Tree:
    """트리"""

    def __init__(self, root_data):
        self.root = TreeNode(root_data)

    def add_node(self, parent_data, child_data):
        """노드 추가"""
        # 깊이 우선 탐색으로 부모 찾기
        def find_node(node, target):
            if node.data == target:
                return node
            for child in node.children:
                result = find_node(child, target)
                if result:
                    return result
            return None

        parent = find_node(self.root, parent_data)
        if parent:
            parent.add_child(TreeNode(child_data))


class Graph:
    """그래프 (인접 리스트)"""

    def __init__(self):
        self.edges = {}

    def add_edge(self, u, v, weight=1):
        """간선 추가"""
        if u not in self.edges:
            self.edges[u] = []
        if v not in self.edges:
            self.edges[v] = []

        self.edges[u].append((v, weight))

    def get_neighbors(self, u):
        """이웃 노드"""
        return self.edges.get(u, [])


class HashSet:
    """해시 집합"""

    def __init__(self):
        self.items = {}

    def add(self, item):
        """요소 추가"""
        self.items[item] = True

    def remove(self, item):
        """요소 제거"""
        if item in self.items:
            del self.items[item]

    def contains(self, item):
        """포함 여부"""
        return item in self.items

    def to_list(self):
        """리스트로 변환"""
        return list(self.items.keys())


class HashTable:
    """해시 테이블"""

    def __init__(self):
        self.table = {}

    def put(self, key, value):
        """값 저장"""
        self.table[key] = value

    def get(self, key, default=None):
        """값 조회"""
        return self.table.get(key, default)

    def remove(self, key):
        """키 제거"""
        if key in self.table:
            del self.table[key]

    def contains(self, key):
        """키 존재 확인"""
        return key in self.table


class MinHeap:
    """최소 힙"""

    def __init__(self):
        self.items = []

    def push(self, item):
        """요소 추가"""
        self.items.append(item)
        self._bubble_up(len(self.items) - 1)

    def pop(self):
        """최소 요소 제거"""
        if len(self.items) == 0:
            raise IndexError("빈 힙")

        min_item = self.items[0]
        self.items[0] = self.items[-1]
        self.items.pop()

        if len(self.items) > 0:
            self._bubble_down(0)

        return min_item

    def peek(self):
        """최소 요소 확인"""
        if len(self.items) == 0:
            raise IndexError("빈 힙")
        return self.items[0]

    def _bubble_up(self, index):
        """위로 이동"""
        while index > 0:
            parent_idx = (index - 1) // 2
            if self.items[index] < self.items[parent_idx]:
                self.items[index], self.items[parent_idx] = self.items[parent_idx], self.items[index]
                index = parent_idx
            else:
                break

    def _bubble_down(self, index):
        """아래로 이동"""
        while True:
            left_idx = 2 * index + 1
            right_idx = 2 * index + 2
            smallest = index

            if left_idx < len(self.items) and self.items[left_idx] < self.items[smallest]:
                smallest = left_idx
            if right_idx < len(self.items) and self.items[right_idx] < self.items[smallest]:
                smallest = right_idx

            if smallest != index:
                self.items[index], self.items[smallest] = self.items[smallest], self.items[index]
                index = smallest
            else:
                break


class TrieNode:
    """트라이 노드"""

    def __init__(self):
        self.children = {}
        self.is_end = False


class Trie:
    """트라이 (문자열 탐색)"""

    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        """단어 삽입"""
        if not isinstance(word, str):
            raise TypeError(f"문자열이 필요함: {type(word)}")

        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end = True

    def search(self, word):
        """단어 검색"""
        if not isinstance(word, str):
            raise TypeError(f"문자열이 필요함: {type(word)}")

        node = self.root
        for char in word:
            if char not in node.children:
                return False
            node = node.children[char]
        return node.is_end

    def starts_with(self, prefix):
        """접두어 검색"""
        if not isinstance(prefix, str):
            raise TypeError(f"문자열이 필요함: {type(prefix)}")

        node = self.root
        for char in prefix:
            if char not in node.children:
                return False
            node = node.children[char]
        return True


class PriorityQueue:
    """우선순위 큐"""

    def __init__(self):
        self.heap = MinHeap()

    def push(self, item, priority):
        """요소 추가 (우선순위)"""
        self.heap.push((priority, item))

    def pop(self):
        """우선순위가 높은 요소 제거"""
        if self.heap.peek() is None:
            raise IndexError("빈 큐")
        priority, item = self.heap.pop()
        return item

    def peek(self):
        """우선순위가 높은 요소 확인"""
        priority, item = self.heap.peek()
        return item


# ============= 알고리즘 =============

class MindLangAlgorithm:
    """MindLang 알고리즘 유틸리티"""

    @staticmethod
    def binary_search(lst, target):
        """이진 탐색 (정렬된 리스트)"""
        if not isinstance(lst, list):
            raise TypeError(f"리스트가 필요함: {type(lst)}")

        left, right = 0, len(lst) - 1

        while left <= right:
            mid = (left + right) // 2
            if lst[mid] == target:
                return mid
            elif lst[mid] < target:
                left = mid + 1
            else:
                right = mid - 1

        return -1

    @staticmethod
    def bubble_sort(lst):
        """거품 정렬"""
        if not isinstance(lst, list):
            raise TypeError(f"리스트가 필요함: {type(lst)}")

        n = len(lst)
        for i in range(n):
            for j in range(0, n - i - 1):
                if lst[j] > lst[j + 1]:
                    lst[j], lst[j + 1] = lst[j + 1], lst[j]

        return lst

    @staticmethod
    def quick_sort(lst):
        """퀵 정렬"""
        if not isinstance(lst, list):
            raise TypeError(f"리스트가 필요함: {type(lst)}")

        if len(lst) <= 1:
            return lst

        pivot = lst[len(lst) // 2]
        left = [x for x in lst if x < pivot]
        middle = [x for x in lst if x == pivot]
        right = [x for x in lst if x > pivot]

        return MindLangAlgorithm.quick_sort(left) + middle + MindLangAlgorithm.quick_sort(right)

    @staticmethod
    def merge_sort(lst):
        """병합 정렬"""
        if not isinstance(lst, list):
            raise TypeError(f"리스트가 필요함: {type(lst)}")

        if len(lst) <= 1:
            return lst

        mid = len(lst) // 2
        left = MindLangAlgorithm.merge_sort(lst[:mid])
        right = MindLangAlgorithm.merge_sort(lst[mid:])

        result = []
        i = j = 0

        while i < len(left) and j < len(right):
            if left[i] < right[j]:
                result.append(left[i])
                i += 1
            else:
                result.append(right[j])
                j += 1

        result.extend(left[i:])
        result.extend(right[j:])

        return result

    @staticmethod
    def dfs(graph, start, visited=None):
        """깊이 우선 탐색"""
        if visited is None:
            visited = set()

        visited.add(start)
        result = [start]

        for neighbor, _ in graph.get_neighbors(start):
            if neighbor not in visited:
                result.extend(MindLangAlgorithm.dfs(graph, neighbor, visited))

        return result

    @staticmethod
    def bfs(graph, start):
        """너비 우선 탐색"""
        visited = {start}
        queue = [start]
        result = []

        while queue:
            node = queue.pop(0)
            result.append(node)

            for neighbor, _ in graph.get_neighbors(node):
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)

        return result

    @staticmethod
    def dijkstra(graph, start, end):
        """다익스트라 (최단 경로)"""
        distances = {node: float('inf') for node in graph.edges}
        distances[start] = 0
        visited = set()

        while len(visited) < len(graph.edges):
            # 방문하지 않은 노드 중 가장 가까운 노드 찾기
            min_node = None
            min_dist = float('inf')

            for node in graph.edges:
                if node not in visited and distances[node] < min_dist:
                    min_node = node
                    min_dist = distances[node]

            if min_node is None:
                break

            visited.add(min_node)

            for neighbor, weight in graph.get_neighbors(min_node):
                new_dist = distances[min_node] + weight
                if new_dist < distances[neighbor]:
                    distances[neighbor] = new_dist

        return distances.get(end, float('inf'))

    @staticmethod
    def floyd_warshall(graph):
        """플로이드-워셜 (모든 쌍 최단 경로)"""
        nodes = list(graph.edges.keys())
        dist = {node: {other: float('inf') for other in nodes} for node in nodes}

        # 초기화
        for node in nodes:
            dist[node][node] = 0

        for node in nodes:
            for neighbor, weight in graph.get_neighbors(node):
                dist[node][neighbor] = weight

        # 플로이드-워셜
        for k in nodes:
            for i in nodes:
                for j in nodes:
                    if dist[i][k] + dist[k][j] < dist[i][j]:
                        dist[i][j] = dist[i][k] + dist[k][j]

        return dist

    @staticmethod
    def topological_sort(graph):
        """위상 정렬 (DAG)"""
        in_degree = {node: 0 for node in graph.edges}

        for node in graph.edges:
            for neighbor, _ in graph.get_neighbors(node):
                in_degree[neighbor] += 1

        queue = [node for node in graph.edges if in_degree[node] == 0]
        result = []

        while queue:
            node = queue.pop(0)
            result.append(node)

            for neighbor, _ in graph.get_neighbors(node):
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        return result

    @staticmethod
    def find_gcd_pair(a, b):
        """GCD 쌍 찾기 (유클리드)"""
        if not isinstance(a, int) or not isinstance(b, int):
            raise TypeError("정수가 필요함")

        a, b = abs(a), abs(b)
        while b != 0:
            a, b = b, a % b
        return a


# ============= 테스트 함수 =============

def run_tests():
    """시간/데이터구조/알고리즘 함수 테스트"""

    print("\n" + "=" * 70)
    print("🧪 MindLang 표준 라이브러리 - Phase 4 테스트")
    print("=" * 70 + "\n")

    tests_passed = 0
    tests_failed = 0

    # ============= 시간 함수 테스트 =============

    # 테스트 1: now()
    try:
        t = MindLangTime.now()
        assert isinstance(t, float) and t > 0
        print("✅ now() - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ now() - 실패: {e}")
        tests_failed += 1

    # 테스트 2: today()
    try:
        d = MindLangTime.today()
        assert isinstance(d, str) and len(d) == 10  # YYYY-MM-DD
        print("✅ today() - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ today() - 실패: {e}")
        tests_failed += 1

    # 테스트 3: timestamp()
    try:
        ts = MindLangTime.timestamp()
        assert isinstance(ts, int) and ts > 0
        print("✅ timestamp() - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ timestamp() - 실패: {e}")
        tests_failed += 1

    # 테스트 4: sleep()
    try:
        start = time.time()
        MindLangTime.sleep(0.1)
        elapsed = time.time() - start
        assert elapsed >= 0.09
        print("✅ sleep() - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ sleep() - 실패: {e}")
        tests_failed += 1

    # 테스트 5: time_diff()
    try:
        diff = MindLangTime.time_diff(100, 150)
        assert diff == 50
        print("✅ time_diff() - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ time_diff() - 실패: {e}")
        tests_failed += 1

    # 테스트 6: format_time()
    try:
        formatted = MindLangTime.format_time(0)
        assert isinstance(formatted, str)
        print("✅ format_time() - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ format_time() - 실패: {e}")
        tests_failed += 1

    # 테스트 7: parse_time()
    try:
        ts = MindLangTime.parse_time("1970-01-01 00:00:00")
        assert ts == 0
        print("✅ parse_time() - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ parse_time() - 실패: {e}")
        tests_failed += 1

    # 테스트 8: add_days()
    try:
        result = MindLangTime.add_days(0, 1)
        assert result == 86400
        print("✅ add_days() - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ add_days() - 실패: {e}")
        tests_failed += 1

    # ============= 데이터 구조 테스트 =============

    # 테스트 9: Stack
    try:
        s = Stack()
        s.push(1)
        s.push(2)
        s.push(3)
        assert s.pop() == 3 and s.pop() == 2
        assert s.size() == 1
        print("✅ Stack - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ Stack - 실패: {e}")
        tests_failed += 1

    # 테스트 10: Queue
    try:
        q = Queue()
        q.enqueue(1)
        q.enqueue(2)
        q.enqueue(3)
        assert q.dequeue() == 1 and q.dequeue() == 2
        assert q.size() == 1
        print("✅ Queue - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ Queue - 실패: {e}")
        tests_failed += 1

    # 테스트 11: LinkedList
    try:
        ll = LinkedList()
        ll.append(1)
        ll.append(2)
        ll.append(3)
        assert ll.to_list() == [1, 2, 3]
        ll.remove(2)
        assert ll.to_list() == [1, 3]
        print("✅ LinkedList - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ LinkedList - 실패: {e}")
        tests_failed += 1

    # 테스트 12: Tree
    try:
        t = Tree("A")
        t.add_node("A", "B")
        t.add_node("A", "C")
        assert len(t.root.children) == 2
        print("✅ Tree - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ Tree - 실패: {e}")
        tests_failed += 1

    # 테스트 13: Graph
    try:
        g = Graph()
        g.add_edge("A", "B", 1)
        g.add_edge("B", "C", 2)
        assert len(g.get_neighbors("A")) == 1
        print("✅ Graph - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ Graph - 실패: {e}")
        tests_failed += 1

    # 테스트 14: HashSet
    try:
        hs = HashSet()
        hs.add("a")
        hs.add("b")
        assert hs.contains("a") == True
        hs.remove("a")
        assert hs.contains("a") == False
        print("✅ HashSet - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ HashSet - 실패: {e}")
        tests_failed += 1

    # 테스트 15: HashTable
    try:
        ht = HashTable()
        ht.put("key1", "value1")
        assert ht.get("key1") == "value1"
        assert ht.contains("key1") == True
        ht.remove("key1")
        assert ht.contains("key1") == False
        print("✅ HashTable - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ HashTable - 실패: {e}")
        tests_failed += 1

    # 테스트 16: MinHeap
    try:
        h = MinHeap()
        h.push(5)
        h.push(2)
        h.push(8)
        h.push(1)
        assert h.pop() == 1
        assert h.pop() == 2
        print("✅ MinHeap - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ MinHeap - 실패: {e}")
        tests_failed += 1

    # 테스트 17: Trie
    try:
        tr = Trie()
        tr.insert("apple")
        tr.insert("app")
        assert tr.search("apple") == True
        assert tr.search("app") == True
        assert tr.search("appl") == False
        assert tr.starts_with("app") == True
        print("✅ Trie - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ Trie - 실패: {e}")
        tests_failed += 1

    # 테스트 18: PriorityQueue
    try:
        pq = PriorityQueue()
        pq.push("low", 3)
        pq.push("high", 1)
        pq.push("medium", 2)
        assert pq.pop() == "high"
        assert pq.pop() == "medium"
        print("✅ PriorityQueue - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ PriorityQueue - 실패: {e}")
        tests_failed += 1

    # ============= 알고리즘 테스트 =============

    # 테스트 19: binary_search()
    try:
        lst = [1, 3, 5, 7, 9]
        assert MindLangAlgorithm.binary_search(lst, 5) == 2
        assert MindLangAlgorithm.binary_search(lst, 6) == -1
        print("✅ binary_search() - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ binary_search() - 실패: {e}")
        tests_failed += 1

    # 테스트 20: bubble_sort()
    try:
        lst = [5, 2, 8, 1, 9]
        MindLangAlgorithm.bubble_sort(lst)
        assert lst == [1, 2, 5, 8, 9]
        print("✅ bubble_sort() - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ bubble_sort() - 실패: {e}")
        tests_failed += 1

    # 테스트 21: quick_sort()
    try:
        lst = [5, 2, 8, 1, 9]
        result = MindLangAlgorithm.quick_sort(lst)
        assert result == [1, 2, 5, 8, 9]
        print("✅ quick_sort() - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ quick_sort() - 실패: {e}")
        tests_failed += 1

    # 테스트 22: merge_sort()
    try:
        lst = [5, 2, 8, 1, 9]
        result = MindLangAlgorithm.merge_sort(lst)
        assert result == [1, 2, 5, 8, 9]
        print("✅ merge_sort() - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ merge_sort() - 실패: {e}")
        tests_failed += 1

    # 테스트 23: dfs()
    try:
        g = Graph()
        g.add_edge("A", "B")
        g.add_edge("B", "C")
        g.add_edge("A", "D")
        result = MindLangAlgorithm.dfs(g, "A")
        assert len(result) == 4 and result[0] == "A"
        print("✅ dfs() - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ dfs() - 실패: {e}")
        tests_failed += 1

    # 테스트 24: bfs()
    try:
        g = Graph()
        g.add_edge("A", "B")
        g.add_edge("B", "C")
        g.add_edge("A", "D")
        result = MindLangAlgorithm.bfs(g, "A")
        assert result[0] == "A"
        print("✅ bfs() - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ bfs() - 실패: {e}")
        tests_failed += 1

    # 테스트 25: dijkstra()
    try:
        g = Graph()
        g.add_edge("A", "B", 1)
        g.add_edge("B", "C", 2)
        g.add_edge("A", "D", 5)
        dist = MindLangAlgorithm.dijkstra(g, "A", "C")
        assert dist == 3
        print("✅ dijkstra() - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ dijkstra() - 실패: {e}")
        tests_failed += 1

    # 테스트 26: floyd_warshall()
    try:
        g = Graph()
        g.add_edge("A", "B", 1)
        g.add_edge("B", "C", 2)
        dist = MindLangAlgorithm.floyd_warshall(g)
        assert dist["A"]["C"] == 3
        print("✅ floyd_warshall() - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ floyd_warshall() - 실패: {e}")
        tests_failed += 1

    # 테스트 27: topological_sort()
    try:
        g = Graph()
        g.add_edge("A", "B")
        g.add_edge("B", "C")
        g.add_edge("A", "C")
        result = MindLangAlgorithm.topological_sort(g)
        assert result.index("A") < result.index("B")
        assert result.index("B") < result.index("C")
        print("✅ topological_sort() - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ topological_sort() - 실패: {e}")
        tests_failed += 1

    # 테스트 28: find_gcd_pair()
    try:
        gcd = MindLangAlgorithm.find_gcd_pair(12, 8)
        assert gcd == 4
        gcd2 = MindLangAlgorithm.find_gcd_pair(17, 19)
        assert gcd2 == 1
        print("✅ find_gcd_pair() - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ find_gcd_pair() - 실패: {e}")
        tests_failed += 1

    # 최종 결과
    print("\n" + "=" * 70)
    print(f"📊 테스트 결과: {tests_passed}/28 통과")
    print(f"✅ 성공: {tests_passed}")
    print(f"❌ 실패: {tests_failed}")
    print("=" * 70)

    return tests_failed == 0


if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1)
