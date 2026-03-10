import axios from 'axios';
import { config } from 'dotenv';

config();

const GOGS_API_URL = process.env.GOGS_API_URL;
const GOGS_TOKEN = process.env.GOGS_TOKEN;

if (!GOGS_API_URL || !GOGS_TOKEN) {
  throw new Error('GOGS_API_URL and GOGS_TOKEN must be set in .env');
}

const client = axios.create({
  baseURL: GOGS_API_URL,
  headers: {
    'Authorization': `token ${GOGS_TOKEN}`,
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

/**
 * 저장소의 파일 콘텐츠 조회
 */
export async function getFileContent(owner, repo, path) {
  try {
    const response = await client.get(
      `/repos/${owner}/${repo}/contents/${path}`
    );

    if (response.data.content) {
      return Buffer.from(response.data.content, 'base64').toString('utf-8');
    }

    return response.data;
  } catch (error) {
    console.error(`Failed to get file content: ${error.message}`);
    throw error;
  }
}

/**
 * 저장소 파일 목록 조회
 */
export async function listFiles(owner, repo, path = '') {
  try {
    const response = await client.get(
      `/repos/${owner}/${repo}/contents/${path}`
    );

    if (Array.isArray(response.data)) {
      return response.data.map(item => ({
        name: item.name,
        path: item.path,
        type: item.type,
        size: item.size
      }));
    }

    return [];
  } catch (error) {
    console.error(`Failed to list files: ${error.message}`);
    throw error;
  }
}

/**
 * 저장소 정보 조회
 */
export async function getRepositoryInfo(owner, repo) {
  try {
    const response = await client.get(`/repos/${owner}/${repo}`);

    return {
      name: response.data.name,
      description: response.data.description,
      url: response.data.html_url,
      private: response.data.private,
      created_at: response.data.created_at,
      updated_at: response.data.updated_at
    };
  } catch (error) {
    console.error(`Failed to get repository info: ${error.message}`);
    throw error;
  }
}

/**
 * 저장소에서 특정 패턴의 파일 검색
 */
export async function searchFiles(owner, repo, pattern, path = '') {
  try {
    const files = await listFiles(owner, repo, path);
    const regex = new RegExp(pattern, 'i');

    return files.filter(file =>
      regex.test(file.name) && file.type === 'file'
    );
  } catch (error) {
    console.error(`Failed to search files: ${error.message}`);
    throw error;
  }
}

/**
 * 저장소의 모든 마크다운 파일 콘텐츠 수집
 */
export async function collectMarkdownFiles(owner, repo, path = '') {
  try {
    const files = await listFiles(owner, repo, path);
    const contents = [];

    for (const file of files) {
      if (file.type === 'file' && /\.(md|txt|js|py)$/i.test(file.name)) {
        try {
          const content = await getFileContent(owner, repo, file.path);
          contents.push({
            path: file.path,
            name: file.name,
            content: content,
            size: file.size
          });
        } catch (e) {
          console.warn(`Skipped ${file.path}: ${e.message}`);
        }
      } else if (file.type === 'dir') {
        // 재귀적으로 서브디렉토리 탐색 (최대 2단계)
        if (!path.split('/').filter(Boolean).length > 1) {
          try {
            const subContents = await collectMarkdownFiles(owner, repo, file.path);
            contents.push(...subContents);
          } catch (e) {
            console.warn(`Skipped directory ${file.path}: ${e.message}`);
          }
        }
      }
    }

    return contents;
  } catch (error) {
    console.error(`Failed to collect markdown files: ${error.message}`);
    throw error;
  }
}

export default {
  getFileContent,
  listFiles,
  getRepositoryInfo,
  searchFiles,
  collectMarkdownFiles
};
