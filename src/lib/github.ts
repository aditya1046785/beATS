import "server-only";

type GitHubRepo = {
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  topics?: string[];
  homepage: string | null;
  fork: boolean;
  stargazers_count: number;
  updated_at: string;
  default_branch: string;
};

async function githubFetch<T>(token: string, url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers || {}),
    },
  });
  if (!response.ok) throw new Error(`GitHub request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export async function exchangeCodeForToken(code: string) {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const payload = (await response.json()) as { access_token?: string; error_description?: string };
  if (!payload.access_token) throw new Error(payload.error_description || "GitHub OAuth failed");
  return payload.access_token;
}

export async function getGitHubProfile(token: string) {
  const user = await githubFetch<{
    id: number;
    login: string;
    name: string | null;
    email: string | null;
    avatar_url: string;
  }>(token, "https://api.github.com/user");

  let email = user.email || "";
  if (!email) {
    const emails = await githubFetch<Array<{ email: string; primary: boolean; verified: boolean }>>(
      token,
      "https://api.github.com/user/emails",
    ).catch(() => []);
    email = emails.find((item) => item.primary && item.verified)?.email || "";
  }

  return {
    githubId: String(user.id),
    githubUsername: user.login,
    name: user.name || user.login,
    email,
    avatarUrl: user.avatar_url,
  };
}

export async function fetchAllRepos(token: string) {
  const repos: GitHubRepo[] = [];
  for (let page = 1; page <= 20; page += 1) {
    const batch = await githubFetch<GitHubRepo[]>(
      token,
      `https://api.github.com/user/repos?visibility=public&affiliation=owner&per_page=100&page=${page}&sort=updated`,
    );
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  return repos;
}

export async function fetchLanguages(token: string, owner: string, repo: string) {
  return githubFetch<Record<string, number>>(token, `https://api.github.com/repos/${owner}/${repo}/languages`).catch(
    () => ({}),
  );
}

export async function fetchRepoFile(token: string, owner: string, repo: string, filePath: string) {
  const encoded = filePath.split("/").map(encodeURIComponent).join("/");
  const item = await githubFetch<{ content: string; encoding: string }>(
    token,
    `https://api.github.com/repos/${owner}/${repo}/contents/${encoded}`,
  ).catch(() => null);
  if (!item?.content) return "";
  return Buffer.from(item.content, item.encoding as BufferEncoding).toString("utf8").slice(0, 12000);
}

export async function fetchPinnedRepoNames(token: string, username: string) {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `query($login: String!) {
        user(login: $login) {
          pinnedItems(first: 6, types: REPOSITORY) {
            nodes { ... on Repository { name } }
          }
        }
      }`,
      variables: { login: username },
    }),
  });
  if (!response.ok) return new Set<string>();
  const payload = (await response.json()) as { data?: { user?: { pinnedItems?: { nodes?: Array<{ name: string }> } } } };
  return new Set(payload.data?.user?.pinnedItems?.nodes?.map((node) => node.name) || []);
}

export type { GitHubRepo };
