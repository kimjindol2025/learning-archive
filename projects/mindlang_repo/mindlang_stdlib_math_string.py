#!/usr/bin/env python3
"""
MindLang 표준 라이브러리 - Phase 2: 수학/통계 & 문자열 처리
27개 필수 함수 구현 (외부 의존성 없음)

함수:
├─ 수학 & 통계 (15개)
│  ├─ sqrt()      - 제곱근
│  ├─ ceil()      - 올림
│  ├─ floor()     - 내림
│  ├─ sin()       - 사인
│  ├─ cos()       - 코사인
│  ├─ tan()       - 탄젠트
│  ├─ log()       - 로그
│  ├─ exp()       - 지수
│  ├─ mean()      - 평균
│  ├─ median()    - 중앙값
│  ├─ stdev()     - 표준편차
│  ├─ variance()  - 분산
│  ├─ gcd()       - 최대공약수
│  ├─ lcm()       - 최소공배수
│  └─ factorial() - 팩토리얼
└─ 문자열 (12개)
   ├─ upper()      - 대문자 변환
   ├─ lower()      - 소문자 변환
   ├─ capitalize() - 첫 글자 대문자
   ├─ strip()      - 공백 제거
   ├─ split()      - 문자열 분할
   ├─ join()       - 문자열 합병
   ├─ find()       - 부분 문자열 찾기
   ├─ replace()    - 문자열 치환
   ├─ startswith() - 시작 확인
   ├─ endswith()   - 종료 확인
   ├─ reverse()    - 문자열 역순
   └─ format()     - 문자열 포맷팅
"""

class MindLangStdlib:
    """MindLang 표준 라이브러리 - Phase 2"""

    # ============= 수학 함수 =============

    @staticmethod
    def sqrt(value):
        """제곱근 (Newton-Raphson 방법)"""
        if not isinstance(value, (int, float)):
            raise TypeError(f"제곱근을 구할 수 없음: {type(value)}")
        if value < 0:
            raise ValueError(f"음수의 제곱근: {value}")

        if value == 0:
            return 0.0

        # Newton-Raphson: x_{n+1} = (x_n + value/x_n) / 2
        x = value
        for _ in range(50):  # 수렴 반복
            x_new = (x + value / x) / 2
            if abs(x_new - x) < 1e-15:
                break
            x = x_new
        return x

    @staticmethod
    def ceil(value):
        """올림"""
        if not isinstance(value, (int, float)):
            raise TypeError(f"올림할 수 없음: {type(value)}")
        if value == int(value):
            return int(value)
        return int(value) + (1 if value > 0 else 0)

    @staticmethod
    def floor(value):
        """내림"""
        if not isinstance(value, (int, float)):
            raise TypeError(f"내림할 수 없음: {type(value)}")
        if value == int(value):
            return int(value)
        return int(value) - (1 if value < 0 else 0)

    @staticmethod
    def sin(radians):
        """사인 (Taylor 급수)"""
        if not isinstance(radians, (int, float)):
            raise TypeError(f"사인을 구할 수 없음: {type(radians)}")

        # Taylor 급수: sin(x) = x - x³/3! + x⁵/5! - x⁷/7! + ...
        # [-π, π] 범위로 정규화
        pi = 3.14159265358979323846

        # 범위 정규화
        x = radians
        while x > pi:
            x -= 2 * pi
        while x < -pi:
            x += 2 * pi

        result = 0.0
        term = x
        for n in range(1, 20):
            result += term
            term *= -x * x / ((2 * n) * (2 * n + 1))

        return result

    @staticmethod
    def cos(radians):
        """코사인 (Taylor 급수)"""
        if not isinstance(radians, (int, float)):
            raise TypeError(f"코사인을 구할 수 없음: {type(radians)}")

        # Taylor 급수: cos(x) = 1 - x²/2! + x⁴/4! - x⁶/6! + ...
        pi = 3.14159265358979323846

        # 범위 정규화
        x = radians
        while x > pi:
            x -= 2 * pi
        while x < -pi:
            x += 2 * pi

        result = 1.0
        term = 1.0
        for n in range(1, 20):
            term *= -x * x / ((2 * n - 1) * (2 * n))
            result += term

        return result

    @staticmethod
    def tan(radians):
        """탄젠트"""
        if not isinstance(radians, (int, float)):
            raise TypeError(f"탄젠트를 구할 수 없음: {type(radians)}")

        cos_val = MindLangStdlib.cos(radians)
        if abs(cos_val) < 1e-15:
            raise ValueError("탄젠트: cos가 0에 가까움")

        sin_val = MindLangStdlib.sin(radians)
        return sin_val / cos_val

    @staticmethod
    def log(value, base=None):
        """로그 (자연로그 또는 임의 밑)"""
        if not isinstance(value, (int, float)):
            raise TypeError(f"로그를 구할 수 없음: {type(value)}")
        if value <= 0:
            raise ValueError(f"양수가 필요함: {value}")

        # 자연로그: ln(x)의 정확한 계산 (Newton-Raphson)
        if base is None:
            # 자연로그 계산
            if value == 1:
                return 0.0

            # Newton-Raphson: e^y = value를 만족하는 y를 찾음
            # f(y) = e^y - value = 0
            # y_{n+1} = y_n - f(y_n)/f'(y_n) = y_n - (e^y_n - value)/e^y_n
            y = 0.0
            if value > 1:
                y = 1.0  # 초기값
            else:
                y = -1.0  # value < 1일 때

            for _ in range(100):
                exp_y = MindLangStdlib.exp(y)
                y_new = y - (exp_y - value) / exp_y
                if abs(y_new - y) < 1e-15:
                    break
                y = y_new

            return y
        else:
            # 로그 변환: log_b(x) = ln(x) / ln(b)
            if not isinstance(base, (int, float)):
                raise TypeError(f"밑이 유효하지 않음: {type(base)}")
            if base <= 0 or base == 1:
                raise ValueError(f"유효한 밑: {base}")

            ln_value = MindLangStdlib.log(value)
            ln_base = MindLangStdlib.log(base)
            return ln_value / ln_base

    @staticmethod
    def exp(value):
        """지수 (e^x, Taylor 급수)"""
        if not isinstance(value, (int, float)):
            raise TypeError(f"지수를 구할 수 없음: {type(value)}")

        # Taylor 급수: e^x = 1 + x + x²/2! + x³/3! + x⁴/4! + ...
        result = 1.0
        term = 1.0
        for n in range(1, 50):
            term *= value / n
            result += term
            if abs(term) < 1e-15:
                break

        return result

    @staticmethod
    def mean(values):
        """평균"""
        if not isinstance(values, (list, tuple)):
            raise TypeError(f"리스트가 필요함: {type(values)}")
        if len(values) == 0:
            raise ValueError("빈 리스트")

        return sum(values) / len(values)

    @staticmethod
    def median(values):
        """중앙값"""
        if not isinstance(values, (list, tuple)):
            raise TypeError(f"리스트가 필요함: {type(values)}")
        if len(values) == 0:
            raise ValueError("빈 리스트")

        # 정렬
        sorted_values = sorted(values)
        n = len(sorted_values)

        if n % 2 == 1:
            return sorted_values[n // 2]
        else:
            return (sorted_values[n // 2 - 1] + sorted_values[n // 2]) / 2

    @staticmethod
    def variance(values):
        """분산"""
        if not isinstance(values, (list, tuple)):
            raise TypeError(f"리스트가 필요함: {type(values)}")
        if len(values) == 0:
            raise ValueError("빈 리스트")

        m = MindLangStdlib.mean(values)
        sum_sq_dev = sum((x - m) ** 2 for x in values)
        return sum_sq_dev / len(values)

    @staticmethod
    def stdev(values):
        """표준편차"""
        if not isinstance(values, (list, tuple)):
            raise TypeError(f"리스트가 필요함: {type(values)}")
        if len(values) == 0:
            raise ValueError("빈 리스트")

        var = MindLangStdlib.variance(values)
        return MindLangStdlib.sqrt(var)

    @staticmethod
    def gcd(a, b):
        """최대공약수 (유클리드 알고리즘)"""
        if not isinstance(a, int) or not isinstance(b, int):
            raise TypeError("정수가 필요함")

        a, b = abs(a), abs(b)
        while b != 0:
            a, b = b, a % b
        return a

    @staticmethod
    def lcm(a, b):
        """최소공배수"""
        if not isinstance(a, int) or not isinstance(b, int):
            raise TypeError("정수가 필요함")

        if a == 0 or b == 0:
            return 0

        gcd_val = MindLangStdlib.gcd(a, b)
        return abs(a * b) // gcd_val

    @staticmethod
    def factorial(n):
        """팩토리얼"""
        if not isinstance(n, int):
            raise TypeError("정수가 필요함")
        if n < 0:
            raise ValueError("음수는 불가")

        result = 1
        for i in range(2, n + 1):
            result *= i
        return result

    # ============= 문자열 함수 =============

    @staticmethod
    def upper(s):
        """대문자 변환"""
        if not isinstance(s, str):
            raise TypeError(f"문자열이 필요함: {type(s)}")

        result = ""
        for char in s:
            if 'a' <= char <= 'z':
                result += chr(ord(char) - 32)
            else:
                result += char
        return result

    @staticmethod
    def lower(s):
        """소문자 변환"""
        if not isinstance(s, str):
            raise TypeError(f"문자열이 필요함: {type(s)}")

        result = ""
        for char in s:
            if 'A' <= char <= 'Z':
                result += chr(ord(char) + 32)
            else:
                result += char
        return result

    @staticmethod
    def capitalize(s):
        """첫 글자 대문자"""
        if not isinstance(s, str):
            raise TypeError(f"문자열이 필요함: {type(s)}")

        if len(s) == 0:
            return s

        return MindLangStdlib.upper(s[0]) + MindLangStdlib.lower(s[1:])

    @staticmethod
    def strip(s):
        """공백 제거"""
        if not isinstance(s, str):
            raise TypeError(f"문자열이 필요함: {type(s)}")

        start = 0
        end = len(s)

        # 앞의 공백 제거
        while start < len(s) and s[start] in ' \t\n\r':
            start += 1

        # 뒤의 공백 제거
        while end > start and s[end - 1] in ' \t\n\r':
            end -= 1

        return s[start:end]

    @staticmethod
    def split(s, delimiter=None):
        """문자열 분할"""
        if not isinstance(s, str):
            raise TypeError(f"문자열이 필요함: {type(s)}")

        if delimiter is None:
            # 공백으로 분할
            parts = []
            current = ""
            for char in s:
                if char in ' \t\n\r':
                    if current:
                        parts.append(current)
                        current = ""
                else:
                    current += char
            if current:
                parts.append(current)
            return parts
        else:
            # 지정된 구분자로 분할
            if not isinstance(delimiter, str):
                raise TypeError("구분자는 문자열이어야 함")

            parts = []
            current = ""
            i = 0
            while i < len(s):
                if s[i:i+len(delimiter)] == delimiter:
                    parts.append(current)
                    current = ""
                    i += len(delimiter)
                else:
                    current += s[i]
                    i += 1
            parts.append(current)
            return parts

    @staticmethod
    def join(delimiter, strings):
        """문자열 합병"""
        if not isinstance(delimiter, str):
            raise TypeError("구분자는 문자열이어야 함")
        if not isinstance(strings, (list, tuple)):
            raise TypeError("리스트가 필요함")

        result = ""
        for i, s in enumerate(strings):
            if i > 0:
                result += delimiter
            result += str(s)
        return result

    @staticmethod
    def find(s, substring):
        """부분 문자열 찾기"""
        if not isinstance(s, str) or not isinstance(substring, str):
            raise TypeError("문자열이 필요함")

        if len(substring) == 0:
            return 0

        for i in range(len(s) - len(substring) + 1):
            if s[i:i+len(substring)] == substring:
                return i

        return -1

    @staticmethod
    def replace(s, old, new):
        """문자열 치환"""
        if not isinstance(s, str) or not isinstance(old, str) or not isinstance(new, str):
            raise TypeError("문자열이 필요함")

        if len(old) == 0:
            raise ValueError("빈 부분 문자열")

        result = ""
        i = 0
        while i < len(s):
            if s[i:i+len(old)] == old:
                result += new
                i += len(old)
            else:
                result += s[i]
                i += 1

        return result

    @staticmethod
    def startswith(s, prefix):
        """시작 확인"""
        if not isinstance(s, str) or not isinstance(prefix, str):
            raise TypeError("문자열이 필요함")

        return s[:len(prefix)] == prefix

    @staticmethod
    def endswith(s, suffix):
        """종료 확인"""
        if not isinstance(s, str) or not isinstance(suffix, str):
            raise TypeError("문자열이 필요함")

        if len(suffix) > len(s):
            return False

        return s[-len(suffix):] == suffix

    @staticmethod
    def reverse(s):
        """문자열 역순"""
        if not isinstance(s, str):
            raise TypeError(f"문자열이 필요함: {type(s)}")

        result = ""
        for i in range(len(s) - 1, -1, -1):
            result += s[i]

        return result

    @staticmethod
    def format(template, *args, **kwargs):
        """문자열 포맷팅"""
        if not isinstance(template, str):
            raise TypeError("템플릿은 문자열이어야 함")

        result = ""
        i = 0
        arg_index = 0

        while i < len(template):
            if template[i] == '{':
                # {}를 찾기
                j = i + 1
                while j < len(template) and template[j] != '}':
                    j += 1

                if j < len(template):
                    placeholder = template[i+1:j]

                    if placeholder == "":
                        # {} = 위치 인수
                        if arg_index < len(args):
                            result += str(args[arg_index])
                            arg_index += 1
                    elif placeholder.isdigit():
                        # {0}, {1} = 위치 인수
                        idx = int(placeholder)
                        if idx < len(args):
                            result += str(args[idx])
                    else:
                        # {name} = 키워드 인수
                        if placeholder in kwargs:
                            result += str(kwargs[placeholder])

                    i = j + 1
                else:
                    result += template[i]
                    i += 1
            else:
                result += template[i]
                i += 1

        return result


# ============= 테스트 함수 =============

def run_tests():
    """수학/통계 & 문자열 함수 테스트"""
    stdlib = MindLangStdlib()

    print("\n" + "=" * 70)
    print("🧪 MindLang 표준 라이브러리 - Phase 2 테스트")
    print("=" * 70 + "\n")

    tests_passed = 0
    tests_failed = 0

    # ============= 수학 함수 테스트 =============

    # 테스트 1: sqrt()
    try:
        assert abs(stdlib.sqrt(4) - 2.0) < 1e-10
        assert abs(stdlib.sqrt(9) - 3.0) < 1e-10
        assert abs(stdlib.sqrt(2) - 1.41421356) < 1e-6
        print("✅ sqrt() - 통과")
        tests_passed += 1
    except AssertionError as e:
        print(f"❌ sqrt() - 실패: {e}")
        tests_failed += 1

    # 테스트 2: ceil()
    try:
        assert stdlib.ceil(3.2) == 4
        assert stdlib.ceil(3.0) == 3
        assert stdlib.ceil(-2.1) == -2
        print("✅ ceil() - 통과")
        tests_passed += 1
    except AssertionError as e:
        print(f"❌ ceil() - 실패: {e}")
        tests_failed += 1

    # 테스트 3: floor()
    try:
        assert stdlib.floor(3.9) == 3
        assert stdlib.floor(3.0) == 3
        assert stdlib.floor(-2.1) == -3
        print("✅ floor() - 통과")
        tests_passed += 1
    except AssertionError as e:
        print(f"❌ floor() - 실패: {e}")
        tests_failed += 1

    # 테스트 4: sin()
    try:
        assert abs(stdlib.sin(0) - 0) < 1e-10
        assert abs(stdlib.sin(3.14159265358979 / 2) - 1.0) < 1e-6
        print("✅ sin() - 통과")
        tests_passed += 1
    except AssertionError as e:
        print(f"❌ sin() - 실패: {e}")
        tests_failed += 1

    # 테스트 5: cos()
    try:
        assert abs(stdlib.cos(0) - 1.0) < 1e-10
        assert abs(stdlib.cos(3.14159265358979) - (-1.0)) < 1e-6
        print("✅ cos() - 통과")
        tests_passed += 1
    except AssertionError as e:
        print(f"❌ cos() - 실패: {e}")
        tests_failed += 1

    # 테스트 6: tan()
    try:
        assert abs(stdlib.tan(0) - 0) < 1e-10
        print("✅ tan() - 통과")
        tests_passed += 1
    except AssertionError as e:
        print(f"❌ tan() - 실패: {e}")
        tests_failed += 1

    # 테스트 7: log()
    try:
        assert abs(stdlib.log(1) - 0) < 1e-10
        assert abs(stdlib.log(2.71828182845904) - 1.0) < 1e-5
        assert abs(stdlib.log(100, 10) - 2.0) < 1e-10
        print("✅ log() - 통과")
        tests_passed += 1
    except AssertionError as e:
        print(f"❌ log() - 실패: {e}")
        tests_failed += 1

    # 테스트 8: exp()
    try:
        assert abs(stdlib.exp(0) - 1.0) < 1e-10
        assert abs(stdlib.exp(1) - 2.71828182) < 1e-6
        print("✅ exp() - 통과")
        tests_passed += 1
    except AssertionError as e:
        print(f"❌ exp() - 실패: {e}")
        tests_failed += 1

    # 테스트 9: mean()
    try:
        assert stdlib.mean([1, 2, 3, 4, 5]) == 3.0
        assert stdlib.mean([10]) == 10.0
        print("✅ mean() - 통과")
        tests_passed += 1
    except AssertionError as e:
        print(f"❌ mean() - 실패: {e}")
        tests_failed += 1

    # 테스트 10: median()
    try:
        assert stdlib.median([1, 2, 3, 4, 5]) == 3
        assert stdlib.median([1, 2, 3, 4]) == 2.5
        print("✅ median() - 통과")
        tests_passed += 1
    except AssertionError as e:
        print(f"❌ median() - 실패: {e}")
        tests_failed += 1

    # 테스트 11: variance()
    try:
        var = stdlib.variance([1, 2, 3, 4, 5])
        assert abs(var - 2.0) < 1e-10
        print("✅ variance() - 통과")
        tests_passed += 1
    except AssertionError as e:
        print(f"❌ variance() - 실패: {e}")
        tests_failed += 1

    # 테스트 12: stdev()
    try:
        stdev = stdlib.stdev([1, 2, 3, 4, 5])
        assert abs(stdev - 1.41421356) < 1e-6
        print("✅ stdev() - 통과")
        tests_passed += 1
    except AssertionError as e:
        print(f"❌ stdev() - 실패: {e}")
        tests_failed += 1

    # 테스트 13: gcd()
    try:
        assert stdlib.gcd(12, 8) == 4
        assert stdlib.gcd(17, 19) == 1
        assert stdlib.gcd(-12, 8) == 4
        print("✅ gcd() - 통과")
        tests_passed += 1
    except AssertionError as e:
        print(f"❌ gcd() - 실패: {e}")
        tests_failed += 1

    # 테스트 14: lcm()
    try:
        assert stdlib.lcm(12, 8) == 24
        assert stdlib.lcm(5, 7) == 35
        print("✅ lcm() - 통과")
        tests_passed += 1
    except AssertionError as e:
        print(f"❌ lcm() - 실패: {e}")
        tests_failed += 1

    # 테스트 15: factorial()
    try:
        assert stdlib.factorial(0) == 1
        assert stdlib.factorial(5) == 120
        assert stdlib.factorial(10) == 3628800
        print("✅ factorial() - 통과")
        tests_passed += 1
    except AssertionError as e:
        print(f"❌ factorial() - 실패: {e}")
        tests_failed += 1

    # ============= 문자열 함수 테스트 =============

    # 테스트 16: upper()
    try:
        assert stdlib.upper("hello") == "HELLO"
        assert stdlib.upper("MixEd") == "MIXED"
        print("✅ upper() - 통과")
        tests_passed += 1
    except AssertionError as e:
        print(f"❌ upper() - 실패: {e}")
        tests_failed += 1

    # 테스트 17: lower()
    try:
        assert stdlib.lower("HELLO") == "hello"
        assert stdlib.lower("MixEd") == "mixed"
        print("✅ lower() - 통과")
        tests_passed += 1
    except AssertionError as e:
        print(f"❌ lower() - 실패: {e}")
        tests_failed += 1

    # 테스트 18: capitalize()
    try:
        assert stdlib.capitalize("hello world") == "Hello world"
        assert stdlib.capitalize("HELLO") == "Hello"
        print("✅ capitalize() - 통과")
        tests_passed += 1
    except AssertionError as e:
        print(f"❌ capitalize() - 실패: {e}")
        tests_failed += 1

    # 테스트 19: strip()
    try:
        assert stdlib.strip("  hello  ") == "hello"
        assert stdlib.strip("\n\thello\r") == "hello"
        print("✅ strip() - 통과")
        tests_passed += 1
    except AssertionError as e:
        print(f"❌ strip() - 실패: {e}")
        tests_failed += 1

    # 테스트 20: split()
    try:
        assert stdlib.split("a,b,c", ",") == ["a", "b", "c"]
        assert stdlib.split("hello world") == ["hello", "world"]
        print("✅ split() - 통과")
        tests_passed += 1
    except AssertionError as e:
        print(f"❌ split() - 실패: {e}")
        tests_failed += 1

    # 테스트 21: join()
    try:
        assert stdlib.join(",", ["a", "b", "c"]) == "a,b,c"
        assert stdlib.join(" ", ["hello", "world"]) == "hello world"
        print("✅ join() - 통과")
        tests_passed += 1
    except AssertionError as e:
        print(f"❌ join() - 실패: {e}")
        tests_failed += 1

    # 테스트 22: find()
    try:
        assert stdlib.find("hello", "ll") == 2
        assert stdlib.find("hello", "x") == -1
        assert stdlib.find("hello", "hello") == 0
        print("✅ find() - 통과")
        tests_passed += 1
    except AssertionError as e:
        print(f"❌ find() - 실패: {e}")
        tests_failed += 1

    # 테스트 23: replace()
    try:
        assert stdlib.replace("hello", "l", "L") == "heLLo"
        assert stdlib.replace("aaa", "a", "b") == "bbb"
        print("✅ replace() - 통과")
        tests_passed += 1
    except AssertionError as e:
        print(f"❌ replace() - 실패: {e}")
        tests_failed += 1

    # 테스트 24: startswith()
    try:
        assert stdlib.startswith("hello", "he") == True
        assert stdlib.startswith("hello", "lo") == False
        print("✅ startswith() - 통과")
        tests_passed += 1
    except AssertionError as e:
        print(f"❌ startswith() - 실패: {e}")
        tests_failed += 1

    # 테스트 25: endswith()
    try:
        assert stdlib.endswith("hello", "lo") == True
        assert stdlib.endswith("hello", "he") == False
        print("✅ endswith() - 통과")
        tests_passed += 1
    except AssertionError as e:
        print(f"❌ endswith() - 실패: {e}")
        tests_failed += 1

    # 테스트 26: reverse()
    try:
        assert stdlib.reverse("hello") == "olleh"
        assert stdlib.reverse("12345") == "54321"
        print("✅ reverse() - 통과")
        tests_passed += 1
    except AssertionError as e:
        print(f"❌ reverse() - 실패: {e}")
        tests_failed += 1

    # 테스트 27: format()
    try:
        assert stdlib.format("{} + {}", 1, 2) == "1 + 2"
        assert stdlib.format("Hello {name}!", name="World") == "Hello World!"
        assert stdlib.format("{0} {1}", "a", "b") == "a b"
        print("✅ format() - 통과")
        tests_passed += 1
    except AssertionError as e:
        print(f"❌ format() - 실패: {e}")
        tests_failed += 1

    # 최종 결과
    print("\n" + "=" * 70)
    print(f"📊 테스트 결과: {tests_passed}/27 통과")
    print(f"✅ 성공: {tests_passed}")
    print(f"❌ 실패: {tests_failed}")
    print("=" * 70)

    return tests_failed == 0


if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1)
