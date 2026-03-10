/**
 * FreeLang 파일 시스템
 * Node.js fs 모듈을 래핑한 파일 I/O
 *
 * 구현:
 * - File struct: 파일 메타데이터 및 핸들
 * - open(path, mode): 파일 열기
 * - read(): 전체 파일 읽기
 * - write(data): 파일에 쓰기
 * - close(): 파일 닫기
 */

import * as fs from 'fs';
import * as path from 'path';

export type FileMode = 'r' | 'w' | 'a' | 'rw';
const ENCODING: BufferEncoding = 'utf-8';

interface FileStats {
  size: number;
  isFile: boolean;
  isDirectory: boolean;
  created: number;
  modified: number;
}

export class FileHandle {
  private filePath: string;
  private mode: FileMode;
  private content: string = '';
  private isOpen: boolean = false;

  constructor(filePath: string, mode: FileMode = 'r') {
    this.filePath = filePath;
    this.mode = mode;
  }

  /**
   * 파일 열기
   */
  open(): boolean {
    try {
      if (this.mode === 'r' || this.mode === 'rw') {
        if (!fs.existsSync(this.filePath)) {
          console.error(`파일을 찾을 수 없습니다: ${this.filePath}`);
          return false;
        }
        this.content = fs.readFileSync(this.filePath, ENCODING);
      }
      // w, a 모드는 파일 생성 시 내용을 비운 상태로 시작
      if (this.mode === 'w') {
        this.content = '';
      }
      // a 모드는 기존 내용을 읽고 시작
      if (this.mode === 'a') {
        if (fs.existsSync(this.filePath)) {
          this.content = fs.readFileSync(this.filePath, ENCODING);
        } else {
          this.content = '';
        }
      }
      this.isOpen = true;
      return true;
    } catch (error) {
      console.error(`파일 열기 실패: ${error}`);
      return false;
    }
  }

  /**
   * 파일 읽기 (전체)
   */
  read(): string {
    if (!this.isOpen) {
      console.error('파일이 열려있지 않습니다');
      return '';
    }
    return this.content;
  }

  /**
   * 파일 읽기 (라인 단위)
   */
  readLines(): string[] {
    if (!this.isOpen) {
      console.error('파일이 열려있지 않습니다');
      return [];
    }
    return this.content.split('\n');
  }

  /**
   * 파일 쓰기 (덮어쓰기 모드)
   */
  write(data: string): boolean {
    if (!this.isOpen) {
      console.error('파일이 열려있지 않습니다');
      return false;
    }
    if (this.mode !== 'w' && this.mode !== 'rw' && this.mode !== 'a') {
      console.error('읽기 전용 파일입니다');
      return false;
    }
    try {
      this.content = data;
      fs.writeFileSync(this.filePath, data, { encoding: ENCODING });
      return true;
    } catch (error) {
      console.error(`파일 쓰기 실패: ${error}`);
      return false;
    }
  }

  /**
   * 파일 추가 쓰기 (append)
   */
  append(data: string): boolean {
    if (!this.isOpen) {
      console.error('파일이 열려있지 않습니다');
      return false;
    }
    if (this.mode !== 'a' && this.mode !== 'rw') {
      console.error('추가 쓰기가 허용되지 않습니다');
      return false;
    }
    try {
      this.content += data;
      fs.appendFileSync(this.filePath, data, { encoding: ENCODING });
      return true;
    } catch (error) {
      console.error(`파일 추가 실패: ${error}`);
      return false;
    }
  }

  /**
   * 파일 닫기
   */
  close(): boolean {
    if (!this.isOpen) {
      return false;
    }
    // Node.js는 자동 관리이므로 플래그만 변경
    this.isOpen = false;
    this.content = '';
    return true;
  }

  /**
   * 파일 정보 조회
   */
  stats(): FileStats | null {
    try {
      const stat = fs.statSync(this.filePath);
      return {
        size: stat.size,
        isFile: stat.isFile(),
        isDirectory: stat.isDirectory(),
        created: stat.birthtimeMs,
        modified: stat.mtimeMs
      };
    } catch (error) {
      console.error(`파일 정보 조회 실패: ${error}`);
      return null;
    }
  }

  /**
   * 파일 경로
   */
  path(): string {
    return this.filePath;
  }

  /**
   * 파일 존재 여부
   */
  exists(): boolean {
    return fs.existsSync(this.filePath);
  }

  /**
   * 파일이 열려있는지 확인
   */
  isOpened(): boolean {
    return this.isOpen;
  }

  /**
   * 파일 삭제
   */
  delete(): boolean {
    try {
      if (this.isOpen) {
        this.close();
      }
      if (fs.existsSync(this.filePath)) {
        fs.unlinkSync(this.filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`파일 삭제 실패: ${error}`);
      return false;
    }
  }

  /**
   * 파일 크기 (바이트)
   */
  size(): number {
    try {
      const stat = fs.statSync(this.filePath);
      return stat.size;
    } catch (error) {
      return -1;
    }
  }

  /**
   * 파일 라인 수
   */
  lineCount(): number {
    if (!this.isOpen) {
      try {
        const content = fs.readFileSync(this.filePath, ENCODING);
        return content.split('\n').length;
      } catch (error) {
        return -1;
      }
    }
    return this.content.split('\n').length;
  }
}

/**
 * 디렉토리 유틸리티
 */
export class Directory {
  private dirPath: string;

  constructor(dirPath: string) {
    this.dirPath = dirPath;
  }

  /**
   * 디렉토리 생성
   */
  create(): boolean {
    try {
      if (!fs.existsSync(this.dirPath)) {
        fs.mkdirSync(this.dirPath, { recursive: true });
      }
      return true;
    } catch (error) {
      console.error(`디렉토리 생성 실패: ${error}`);
      return false;
    }
  }

  /**
   * 디렉토리 삭제
   */
  delete(): boolean {
    try {
      if (fs.existsSync(this.dirPath)) {
        fs.rmSync(this.dirPath, { recursive: true, force: true });
      }
      return true;
    } catch (error) {
      console.error(`디렉토리 삭제 실패: ${error}`);
      return false;
    }
  }

  /**
   * 디렉토리 존재 여부
   */
  exists(): boolean {
    return fs.existsSync(this.dirPath);
  }

  /**
   * 디렉토리 내 파일 목록
   */
  list(): string[] {
    try {
      if (!fs.existsSync(this.dirPath)) {
        return [];
      }
      return fs.readdirSync(this.dirPath);
    } catch (error) {
      console.error(`파일 목록 조회 실패: ${error}`);
      return [];
    }
  }

  /**
   * 디렉토리 내 파일만 반환
   */
  listFiles(): string[] {
    try {
      if (!fs.existsSync(this.dirPath)) {
        return [];
      }
      const entries = fs.readdirSync(this.dirPath, { withFileTypes: true });
      return entries
        .filter(entry => entry.isFile())
        .map(entry => entry.name);
    } catch (error) {
      console.error(`파일 목록 조회 실패: ${error}`);
      return [];
    }
  }

  /**
   * 디렉토리 내 디렉토리만 반환
   */
  listDirectories(): string[] {
    try {
      if (!fs.existsSync(this.dirPath)) {
        return [];
      }
      const entries = fs.readdirSync(this.dirPath, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
    } catch (error) {
      console.error(`디렉토리 목록 조회 실패: ${error}`);
      return [];
    }
  }

  /**
   * 디렉토리 경로
   */
  getPath(): string {
    return this.dirPath;
  }

  /**
   * 파일 개수
   */
  fileCount(): number {
    return this.listFiles().length;
  }

  /**
   * 전체 항목 개수
   */
  itemCount(): number {
    return this.list().length;
  }
}

/**
 * 파일 시스템 유틸리티
 */
export class FileSystem {
  /**
   * 파일 복사
   */
  static copy(src: string, dst: string): boolean {
    try {
      fs.copyFileSync(src, dst);
      return true;
    } catch (error) {
      console.error(`파일 복사 실패: ${error}`);
      return false;
    }
  }

  /**
   * 파일 이동
   */
  static move(src: string, dst: string): boolean {
    try {
      fs.renameSync(src, dst);
      return true;
    } catch (error) {
      console.error(`파일 이동 실패: ${error}`);
      return false;
    }
  }

  /**
   * 파일 존재 여부
   */
  static exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  /**
   * 파일인지 확인
   */
  static isFile(filePath: string): boolean {
    try {
      return fs.statSync(filePath).isFile();
    } catch (error) {
      return false;
    }
  }

  /**
   * 디렉토리인지 확인
   */
  static isDirectory(filePath: string): boolean {
    try {
      return fs.statSync(filePath).isDirectory();
    } catch (error) {
      return false;
    }
  }

  /**
   * 파일 크기 (바이트)
   */
  static size(filePath: string): number {
    try {
      return fs.statSync(filePath).size;
    } catch (error) {
      return -1;
    }
  }

  /**
   * 마지막 수정 시간
   */
  static lastModified(filePath: string): number {
    try {
      return fs.statSync(filePath).mtimeMs;
    } catch (error) {
      return -1;
    }
  }

  /**
   * 절대 경로 반환
   */
  static absolutePath(filePath: string): string {
    return path.resolve(filePath);
  }

  /**
   * 파일 확장자
   */
  static extension(filePath: string): string {
    return path.extname(filePath);
  }

  /**
   * 파일명 (확장자 제외)
   */
  static baseName(filePath: string): string {
    return path.basename(filePath, path.extname(filePath));
  }

  /**
   * 디렉토리명
   */
  static dirName(filePath: string): string {
    return path.dirname(filePath);
  }

  /**
   * 현재 작업 디렉토리
   */
  static currentDirectory(): string {
    return process.cwd();
  }
}

/**
 * 파일 시스템 초기화 및 통계
 */
export function getFileSystemStats(): {
  version: string;
  features: string[];
  description: string;
} {
  return {
    version: '1.0.0-phase-b-week2',
    features: [
      'FileHandle - 파일 읽기/쓰기/추가',
      'Directory - 디렉토리 관리',
      'FileSystem - 파일 시스템 유틸리티',
      '8가지 파일 모드: r, w, a, rw',
      '파일 메타데이터 조회',
      '디렉토리 목록 조회'
    ],
    description: 'FreeLang 파일 시스템 라이브러리 v1.0'
  };
}
