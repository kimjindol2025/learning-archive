#!/usr/bin/env python3
"""
MindLang 웹 프레임워크 - Phase 1: 초경량 웹 서버
경량 웹 애플리케이션을 위한 미니 프레임워크

특징:
- 라우팅 시스템
- Request/Response 처리
- 미들웨어 파이프라인
- 정적 파일 지원
- JSON 응답
- 에러 핸들링
"""

import json
import http.server
import socketserver
import urllib.parse
import os
from threading import Thread
from typing import Callable, Dict, List, Tuple, Any


class Request:
    """HTTP 요청 객체"""

    def __init__(self, method: str, path: str, headers: Dict, body: str = ""):
        self.method = method
        self.path = path
        self.headers = headers
        self.body = body
        self.query_params = {}
        self.path_params = {}

        # 쿼리 파라미터 파싱
        if "?" in path:
            query_string = path.split("?", 1)[1]
            self.query_params = dict(urllib.parse.parse_qsl(query_string))

    def get_json(self) -> Dict:
        """JSON 바디 파싱"""
        try:
            return json.loads(self.body)
        except json.JSONDecodeError:
            return {}

    def get_query(self, key: str, default: str = None) -> str:
        """쿼리 파라미터 조회"""
        return self.query_params.get(key, default)

    def get_param(self, key: str, default: str = None) -> str:
        """경로 파라미터 조회"""
        return self.path_params.get(key, default)


class Response:
    """HTTP 응답 객체"""

    def __init__(self, status: int = 200, body: str = "", content_type: str = "text/plain"):
        self.status = status
        self.body = body
        self.content_type = content_type
        self.headers = {}

    def set_header(self, key: str, value: str):
        """헤더 설정"""
        self.headers[key] = value
        return self

    def json(self, data: Dict, status: int = 200):
        """JSON 응답"""
        self.status = status
        self.body = json.dumps(data)
        self.content_type = "application/json"
        return self

    def text(self, text: str, status: int = 200):
        """텍스트 응답"""
        self.status = status
        self.body = text
        self.content_type = "text/plain"
        return self

    def html(self, html: str, status: int = 200):
        """HTML 응답"""
        self.status = status
        self.body = html
        self.content_type = "text/html"
        return self

    def error(self, status: int, message: str):
        """에러 응답"""
        self.status = status
        self.body = json.dumps({"error": message})
        self.content_type = "application/json"
        return self


class Route:
    """라우트 정의"""

    def __init__(self, method: str, path: str, handler: Callable):
        self.method = method
        self.path = path
        self.handler = handler
        self.pattern = self._compile_pattern(path)

    def _compile_pattern(self, path: str) -> Tuple[str, List[str]]:
        """경로 패턴 컴파일 (예: /users/:id -> 정규식)"""
        import re
        params = []
        pattern = path

        # :param -> (?P<param>[^/]+)
        for match in re.finditer(r':(\w+)', path):
            param_name = match.group(1)
            params.append(param_name)
            pattern = pattern.replace(f":{param_name}", f"(?P<{param_name}>[^/]+)")

        pattern = f"^{pattern}$"
        return pattern, params

    def match(self, method: str, path: str) -> Tuple[bool, Dict]:
        """경로 매칭"""
        import re
        if self.method != method:
            return False, {}

        match = re.match(self.pattern[0], path)
        if match:
            params = match.groupdict()
            return True, params
        return False, {}


class Middleware:
    """미들웨어 기본 클래스"""

    def before_request(self, request: Request) -> Request:
        """요청 전처리"""
        return request

    def after_response(self, response: Response) -> Response:
        """응답 후처리"""
        return response


class MindLangWeb:
    """MindLang 웹 프레임워크"""

    def __init__(self, host: str = "localhost", port: int = 8080):
        self.host = host
        self.port = port
        self.routes: List[Route] = []
        self.middlewares: List[Middleware] = []
        self.static_dir = None
        self.server = None
        self.server_thread = None

    def route(self, path: str, methods: List[str] = None):
        """라우트 데코레이터"""
        if methods is None:
            methods = ["GET"]

        def decorator(handler: Callable):
            for method in methods:
                route = Route(method, path, handler)
                self.routes.append(route)
            return handler

        return decorator

    def get(self, path: str):
        """GET 라우트"""
        return self.route(path, ["GET"])

    def post(self, path: str):
        """POST 라우트"""
        return self.route(path, ["POST"])

    def put(self, path: str):
        """PUT 라우트"""
        return self.route(path, ["PUT"])

    def delete(self, path: str):
        """DELETE 라우트"""
        return self.route(path, ["DELETE"])

    def use_middleware(self, middleware: Middleware):
        """미들웨어 등록"""
        self.middlewares.append(middleware)
        return self

    def static(self, path: str, directory: str):
        """정적 파일 디렉토리"""
        self.static_dir = (path, directory)
        return self

    def _find_route(self, method: str, path: str) -> Tuple[Route, Dict]:
        """라우트 찾기"""
        clean_path = path.split("?")[0]  # 쿼리 문자열 제거

        for route in self.routes:
            matched, params = route.match(method, clean_path)
            if matched:
                return route, params

        return None, {}

    def _handle_request(self, method: str, path: str, headers: Dict, body: str) -> Response:
        """요청 처리"""
        # 요청 객체 생성
        request = Request(method, path, headers, body)

        # 미들웨어: 전처리
        for middleware in self.middlewares:
            request = middleware.before_request(request)

        # 정적 파일 확인
        if self.static_dir:
            static_path, static_dir = self.static_dir
            if path.startswith(static_path):
                file_path = os.path.join(static_dir, path[len(static_path):].lstrip("/"))
                if os.path.exists(file_path) and os.path.isfile(file_path):
                    try:
                        with open(file_path, "r") as f:
                            return Response(200, f.read(), "text/plain")
                    except IOError:
                        pass

        # 라우트 찾기
        route, params = self._find_route(method, path)
        if route:
            request.path_params = params
            try:
                response = route.handler(request)
                if not isinstance(response, Response):
                    response = Response(200, str(response))
            except Exception as e:
                response = Response(500, f"Internal Server Error: {str(e)}")
        else:
            response = Response(404, json.dumps({"error": "Not Found"}), "application/json")

        # 미들웨어: 후처리
        for middleware in self.middlewares:
            response = middleware.after_response(response)

        return response

    def run(self, debug: bool = False):
        """서버 실행"""
        app = self

        class MindLangRequestHandler(http.server.BaseHTTPRequestHandler):
            def do_GET(self):
                self.handle_request("GET")

            def do_POST(self):
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8")
                self.handle_request("POST", body)

            def do_PUT(self):
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8")
                self.handle_request("PUT", body)

            def do_DELETE(self):
                self.handle_request("DELETE")

            def handle_request(self, method: str, body: str = ""):
                headers = dict(self.headers)
                response = app._handle_request(method, self.path, headers, body)

                self.send_response(response.status)
                self.send_header("Content-Type", response.content_type)
                for key, value in response.headers.items():
                    self.send_header(key, value)
                self.end_headers()

                if response.body:
                    self.wfile.write(response.body.encode("utf-8"))

            def log_message(self, format, *args):
                if debug:
                    super().log_message(format, *args)
                else:
                    pass

        try:
            with socketserver.TCPServer((self.host, self.port), MindLangRequestHandler) as httpd:
                print(f"🚀 MindLang 웹 서버 시작: http://{self.host}:{self.port}")
                httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 서버 종료")
        except Exception as e:
            print(f"❌ 에러: {e}")


# ============= 테스트 =============

def create_test_app():
    """테스트 애플리케이션"""
    app = MindLangWeb("localhost", 8080)

    # 기본 라우트
    @app.get("/")
    def index(req: Request):
        return Response(200, json.dumps({
            "message": "MindLang 웹 프레임워크",
            "version": "1.0.0"
        }), "application/json")

    # JSON API
    @app.get("/api/users")
    def list_users(req: Request):
        return Response(200, json.dumps({
            "users": [
                {"id": 1, "name": "Alice"},
                {"id": 2, "name": "Bob"},
                {"id": 3, "name": "Charlie"}
            ]
        }), "application/json")

    # 경로 파라미터
    @app.get("/api/users/:id")
    def get_user(req: Request):
        user_id = req.get_param("id")
        return Response(200, json.dumps({
            "id": int(user_id),
            "name": f"User {user_id}"
        }), "application/json")

    # POST 라우트
    @app.post("/api/users")
    def create_user(req: Request):
        data = req.get_json()
        return Response(201, json.dumps({
            "id": 4,
            "name": data.get("name", "Unknown")
        }), "application/json")

    # 쿼리 파라미터
    @app.get("/api/search")
    def search(req: Request):
        query = req.get_query("q", "")
        return Response(200, json.dumps({
            "query": query,
            "results": ["Result 1", "Result 2"]
        }), "application/json")

    # HTML 응답
    @app.get("/page")
    def page(req: Request):
        html = """
        <html>
        <head><title>MindLang</title></head>
        <body>
            <h1>MindLang 웹 프레임워크</h1>
            <p>초경량 웹 서버</p>
        </body>
        </html>
        """
        return Response(200, html, "text/html")

    # 에러 처리
    @app.get("/api/error")
    def error(req: Request):
        resp = Response()
        return resp.error(500, "Something went wrong")

    return app


def run_tests():
    """테스트"""
    print("\n" + "=" * 70)
    print("🧪 MindLang 웹 프레임워크 테스트")
    print("=" * 70 + "\n")

    app = create_test_app()

    tests_passed = 0
    tests_failed = 0

    # 테스트 1: 기본 라우트
    try:
        response = app._handle_request("GET", "/", {}, "")
        assert response.status == 200
        assert "MindLang" in response.body
        print("✅ 기본 라우트 - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ 기본 라우트 - 실패: {e}")
        tests_failed += 1

    # 테스트 2: 라우트 목록
    try:
        response = app._handle_request("GET", "/api/users", {}, "")
        assert response.status == 200
        data = json.loads(response.body)
        assert len(data["users"]) == 3
        print("✅ 라우트 목록 - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ 라우트 목록 - 실패: {e}")
        tests_failed += 1

    # 테스트 3: 경로 파라미터
    try:
        response = app._handle_request("GET", "/api/users/42", {}, "")
        assert response.status == 200
        data = json.loads(response.body)
        assert data["id"] == 42
        print("✅ 경로 파라미터 - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ 경로 파라미터 - 실패: {e}")
        tests_failed += 1

    # 테스트 4: POST 요청
    try:
        body = json.dumps({"name": "David"})
        response = app._handle_request("POST", "/api/users", {}, body)
        assert response.status == 201
        data = json.loads(response.body)
        assert data["name"] == "David"
        print("✅ POST 요청 - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ POST 요청 - 실패: {e}")
        tests_failed += 1

    # 테스트 5: 쿼리 파라미터
    try:
        response = app._handle_request("GET", "/api/search?q=test", {}, "")
        assert response.status == 200
        data = json.loads(response.body)
        assert data["query"] == "test"
        print("✅ 쿼리 파라미터 - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ 쿼리 파라미터 - 실패: {e}")
        tests_failed += 1

    # 테스트 6: HTML 응답
    try:
        response = app._handle_request("GET", "/page", {}, "")
        assert response.status == 200
        assert "MindLang" in response.body
        assert response.content_type == "text/html"
        print("✅ HTML 응답 - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ HTML 응답 - 실패: {e}")
        tests_failed += 1

    # 테스트 7: 404 에러
    try:
        response = app._handle_request("GET", "/nonexistent", {}, "")
        assert response.status == 404
        print("✅ 404 에러 - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ 404 에러 - 실패: {e}")
        tests_failed += 1

    # 테스트 8: 에러 응답
    try:
        response = app._handle_request("GET", "/api/error", {}, "")
        assert response.status == 500
        data = json.loads(response.body)
        assert "error" in data
        print("✅ 에러 응답 - 통과")
        tests_passed += 1
    except Exception as e:
        print(f"❌ 에러 응답 - 실패: {e}")
        tests_failed += 1

    print("\n" + "=" * 70)
    print(f"📊 테스트 결과: {tests_passed}/8 통과")
    print(f"✅ 성공: {tests_passed}")
    print(f"❌ 실패: {tests_failed}")
    print("=" * 70)

    return tests_failed == 0


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "run":
        # 서버 실행
        app = create_test_app()
        app.run(debug=True)
    else:
        # 테스트 실행
        success = run_tests()
        exit(0 if success else 1)
