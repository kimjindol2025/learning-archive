# FreeLang Bootstrap 언어 매뉴얼

**버전**: 1.0
**상태**: 부트스트랩 런타임 (완전 자체 호스팅 전)
**기한**: 2026-06-02

---

## 📋 목차

1. [소개](#소개)
2. [기본 문법](#기본-문법)
3. [데이터 타입](#데이터-타입)
4. [연산자](#연산자)
5. [제어 흐름](#제어-흐름)
6. [함수](#함수)
7. [배열과 자료구조](#배열과-자료구조)
8. [내장 함수](#내장-함수)
9. [파일 I/O](#파일-io)
10. [예제](#예제)

---

## 소개

FreeLang Bootstrap은 **부트스트랩 인터프리터**입니다. 이후 FreeLang 자체로 작성된 런타임을 구현하기 위한 기초 역할을 합니다.

### 특징
- 🔧 **자체 구현**: HashMap, Vector, File I/O를 모두 자체 구현
- ⚡ **경량**: 외부 의존성 최소화
- 🎯 **목적**: FreeLang 자기 호스팅 경로의 첫 단계

---

## 기본 문법

### 주석
```freelang
# 이것은 주석입니다
x = 5  # 변수 할당 후 주석
```

### 변수 할당
```freelang
x = 10
y = "hello"
z = [1, 2, 3]
```

### 표현식
```freelang
result = 5 + 3 * 2  # 우선순위: 3 * 2 먼저, 그 다음 5 + 6
msg = "Hello, " + "World"  # 문자열 연결
```

---

## 데이터 타입

### 숫자 (Number)
```freelang
x = 42          # 정수
y = 3.14        # 부동소수점
z = -10         # 음수
```

### 문자열 (String)
```freelang
s1 = "hello"
s2 = 'world'
s3 = "multiline\nstring"
```

### 불린 (Boolean)
```freelang
t = true
f = false
```

### 배열 (Array)
```freelang
arr = [1, 2, 3, 4, 5]
mixed = [1, "two", 3, true]
nested = [[1, 2], [3, 4]]
```

### Null
```freelang
x = null
```

---

## 연산자

### 산술 연산자
```freelang
a = 10 + 5      # 덧셈: 15
b = 10 - 3      # 뺄셈: 7
c = 4 * 3       # 곱셈: 12
d = 15 / 3      # 나눗셈: 5
e = 17 % 5      # 나머지: 2
```

### 비교 연산자
```freelang
x = 5 == 5      # 같음: true (1)
y = 5 != 3      # 다름: true (1)
z = 5 > 3       # 초과: true (1)
w = 5 < 10      # 미만: true (1)
v = 5 <= 5      # 이하: true (1)
u = 5 >= 5      # 이상: true (1)
```

### 논리 연산자
```freelang
a = true && true        # AND: true (1)
b = true || false       # OR: true (1)
c = !true               # NOT: false (0)
```

### 단항 연산자
```freelang
x = -5          # 음수화
y = !true       # 논리 부정
```

---

## 제어 흐름

### if/else 문
```freelang
x = 10

if (x > 5) {
  print("x is big")
} else {
  print("x is small")
}

# 중첩 if
if (x > 5) {
  if (x > 15) {
    print("very big")
  } else {
    print("medium")
  }
}
```

### while 루프
```freelang
i = 0
while (i < 5) {
  print(i)
  i = i + 1
}
```

### 블록
```freelang
{
  x = 5
  y = 10
  z = x + y
}
```

---

## 함수

### 함수 정의
```freelang
fn add(a, b) {
  return a + b
}

result = add(3, 4)  # 7
```

### 여러 매개변수
```freelang
fn greet(name, age) {
  print("Hello, " + name)
  print("Age: " + age)
}

greet("Alice", 25)
```

### 재귀 함수
```freelang
fn factorial(n) {
  if (n <= 1) {
    return 1
  } else {
    return n * factorial(n - 1)
  }
}

print(factorial(5))  # 120
```

---

## 배열과 자료구조

### 배열 생성
```freelang
arr = [1, 2, 3, 4, 5]
```

### 배열 접근
```freelang
x = arr[0]      # 1
y = arr[2]      # 3
```

### 배열 길이
```freelang
len(arr)        # 5
```

### 배열 순회
```freelang
i = 0
while (i < len(arr)) {
  print(arr[i])
  i = i + 1
}
```

---

## 내장 함수

### 출력
```freelang
print("hello")          # 출력
println("world")        # 줄바꿈 출력
```

### 타입 변환
```freelang
str(42)                 # "42"
num("123")              # 123
type(x)                 # "number", "string", "array", etc
```

### 배열/문자열
```freelang
len("hello")            # 5
len([1, 2, 3])          # 3
```

---

## 파일 I/O

파일 I/O는 현재 내부 함수로만 지원됩니다.
향후 FreeLang 런타임에서 공개 API로 제공될 예정입니다.

---

## 예제

### 계산기
```freelang
fn add(a, b) { return a + b }
fn sub(a, b) { return a - b }
fn mul(a, b) { return a * b }

print(add(10, 5))   # 15
print(sub(10, 5))   # 5
print(mul(10, 5))   # 50
```

### 배열 처리
```freelang
numbers = [1, 2, 3, 4, 5]

# 합계
sum = 0
i = 0
while (i < len(numbers)) {
  sum = sum + numbers[i]
  i = i + 1
}
print(sum)  # 15
```

### 피보나치
```freelang
fn fib(n) {
  if (n <= 1) {
    return n
  } else {
    return fib(n - 1) + fib(n - 2)
  }
}

print(fib(10))  # 55
```

---

## 제한사항

### 아직 구현되지 않은 기능
- ❌ 객체 리터럴 (`{key: value}`)
- ❌ for 루프 (C 스타일)
- ❌ 클래스 정의
- ❌ 모듈/임포트
- ❌ 예외 처리 (try/catch)
- ❌ 제너릭

### 향후 계획
이러한 기능들은 **Phase B** (FreeLang 자체 런타임)에서 구현될 예정입니다.

---

## 마치며

FreeLang Bootstrap은 부트스트랩 목적으로 최소한의 기능만 제공합니다.
더 강력한 기능은 FreeLang 자체로 작성된 런타임에서 제공될 것입니다.

**행복한 프로그래밍!** 🚀
