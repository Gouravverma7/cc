interface GitHubRepo {
  name: string;
  description: string;
  private: boolean;
}

interface GitHubGist {
  description: string;
  public: boolean;
  files: Record<string, { content: string }>;
}

class GitHubService {
  private accessToken: string | null = null;

  async authenticate(): Promise<boolean> {
    try {
      // GitHub OAuth flow
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
      
      if (!clientId) {
        throw new Error('GitHub Client ID not configured');
      }

      const redirectUri = `${window.location.origin}/auth/callback`;
      const scope = 'repo,gist';
      
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
      
      // Open GitHub OAuth in popup
      const popup = window.open(authUrl, 'github-auth', 'width=600,height=600');
      
      return new Promise((resolve) => {
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            // Check if token was stored
            const token = localStorage.getItem('github_token');
            if (token) {
              this.accessToken = token;
              resolve(true);
            } else {
              resolve(false);
            }
          }
        }, 1000);
      });
    } catch (error) {
      console.error('GitHub authentication failed:', error);
      return false;
    }
  }

  async createRepository(name: string, description: string, isPrivate: boolean = false): Promise<string | null> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with GitHub');
    }

    try {
      const response = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          private: isPrivate,
          auto_init: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create repository');
      }

      const repo = await response.json();
      return repo.html_url;
    } catch (error) {
      console.error('Failed to create repository:', error);
      return null;
    }
  }

  async createGist(files: Record<string, string>, description: string = 'CodeBuddy.Ai Export', isPublic: boolean = true): Promise<string | null> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with GitHub');
    }

    try {
      const gistFiles: Record<string, { content: string }> = {};
      Object.entries(files).forEach(([filename, content]) => {
        gistFiles[filename] = { content };
      });

      const response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          public: isPublic,
          files: gistFiles
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create gist');
      }

      const gist = await response.json();
      return gist.html_url;
    } catch (error) {
      console.error('Failed to create gist:', error);
      return null;
    }
  }

  async getUserInfo() {
    if (!this.accessToken) {
      throw new Error('Not authenticated with GitHub');
    }

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${this.accessToken}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get user info');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  logout(): void {
    this.accessToken = null;
    localStorage.removeItem('github_token');
  }
}

export const githubService = new GitHubService();