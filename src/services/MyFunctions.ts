import { DaemoFunction } from 'daemo-engine';
import { z } from 'zod';
import axios from 'axios';
import "reflect-metadata";

const HN_BASE_URL = 'https://hacker-news.firebaseio.com/v0';

interface HNStory {
  id: number;
  title?: string;
  url?: string;
  score?: number;
  by?: string;
  time?: number;
  deleted?: boolean;
  dead?: boolean;
  kids?: number[];
  text?: string;
}

export class HackerNewsFunctions {
  
  private async fetchItem(id: number): Promise<any> {
    try {
      const response = await axios.get(`${HN_BASE_URL}/item/${id}.json`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching item ${id}:`, error);
      return null;
    }
  }

  @DaemoFunction({
    description: "Get the current top trending stories from Hacker News. Returns a list of stories with title, url, score, and id.",
    inputSchema: z.object({
      limit: z.number().optional().describe("The number of stories to retrieve (max 50, default 10)")
    }) as any,
    outputSchema: z.object({
      stories: z.array(z.object({
        id: z.number(),
        title: z.string().optional(),
        url: z.string().optional(),
        score: z.number().optional(),
        by: z.string().optional(),
        time: z.number().optional()
      }))
    }) as any
  })
  async getTopStories(args: { limit?: number }) {
    const limit = Math.min(args.limit || 10, 50);
    try {
      const response = await axios.get(`${HN_BASE_URL}/topstories.json`);
      const topIds: number[] = (response.data as number[]).slice(0, limit);
      
      const stories: HNStory[] = await Promise.all(topIds.map((id: number) => this.fetchItem(id)));
      
      return {
        stories: stories.filter((s: HNStory) => s && !s.deleted && !s.dead).map((s: HNStory) => ({
          id: s.id,
          title: s.title,
          url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
          score: s.score,
          by: s.by,
          time: s.time
        }))
      };
    } catch (error) {
      console.error(error);
      return { stories: [] };
    }
  }

  @DaemoFunction({
    description: "Find stories related to a specific topic from top or new stories. Useful for monitoring specific topics.",
    inputSchema: z.object({
      topic: z.string().optional().describe("The topic or keyword to search for. If undefined, returns top stories."),
      scope: z.enum(['top', 'new']).optional().describe("Where to search: 'top' stories (default) or 'new' stories")
    }) as any,
    outputSchema: z.object({
      stories: z.array(z.object({
        id: z.number(),
        title: z.string().optional(),
        url: z.string().optional(),
        score: z.number().optional(),
        by: z.string().optional()
      }))
    }) as any
  })
  async searchStories(args: { topic?: string, scope?: 'top' | 'new' }) {
    try {
      const endpoint = args.scope === 'new' ? 'newstories' : 'topstories';
      const limit = args.scope === 'new' ? 50 : 100;

      const response = await axios.get(`${HN_BASE_URL}/${endpoint}.json`);
      const allIds: number[] = response.data as number[];
      const searchScopeIds = allIds.slice(0, limit);
      
      const items: HNStory[] = await Promise.all(searchScopeIds.map((id: number) => this.fetchItem(id)));
      
      let matches = items;
      if (args.topic) {
        const query = args.topic.toLowerCase();
        matches = items.filter((s: HNStory) => 
          s && !s.deleted && !s.dead && s.title && s.title.toLowerCase().includes(query)
        );
      } else {
         matches = items.filter((s: HNStory) => s && !s.deleted && !s.dead);
      }

      return {
        stories: matches.map((s: HNStory) => ({
          id: s.id,
          title: s.title,
          url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
          score: s.score,
          by: s.by
        }))
      };
    } catch (error) {
      console.error(error);
      return { stories: [] };
    }
  }

  @DaemoFunction({
    description: "Get the top comments for a specific story to summarize discussions. Returns top 10 top-level comments.",
    inputSchema: z.object({
      storyId: z.string().optional().describe("The ID of the story. If undefined, cannot fetch comments.")
    }) as any,
    outputSchema: z.object({
      comments: z.array(z.object({
        id: z.number(),
        by: z.string().optional(),
        text: z.string().optional(),
        kidsCount: z.number().optional()
      }))
    }) as any
  })
  async getStoryComments(args: { storyId?: string }) {
    if (!args.storyId) {
      return { comments: [] };
    }
    try {
      const story = await this.fetchItem(parseInt(args.storyId));
      if (!story || !story.kids) {
        return { comments: [] };
      }

      const commentIds: number[] = story.kids.slice(0, 10);
      const comments: HNStory[] = await Promise.all(commentIds.map((id: number) => this.fetchItem(id)));

      return {
        comments: comments
          .filter((c: HNStory) => c && !c.deleted && !c.dead && c.text)
          .map((c: HNStory) => ({
            id: c.id,
            by: c.by,
            text: c.text, 
            kidsCount: c.kids ? c.kids.length : 0
          }))
      };
    } catch (error) {
      console.error(error);
      return { comments: [] };
    }
  }

  @DaemoFunction({
    description: "Send an alert about a story or summary. Use this to notify the user of relevant findings.",
    inputSchema: z.object({
      message: z.string().describe("The alert message"),
      priority: z.enum(['low', 'high']).optional().describe("Priority of the alert")
    }) as any,
    outputSchema: z.object({
      success: z.boolean()
    }) as any
  })
  async sendAlert(args: { message: string, priority?: 'low' | 'high' }) {
    const timestamp = new Date().toISOString();
    const prefix = args.priority === 'high' ? '🚨 HIGH PRIORITY ALERT' : 'ℹ️ ALERT';
    console.log(`\n${prefix} [${timestamp}]: ${args.message}\n`);
    return { success: true };
  }
}
