import { SUBMISSION_DETAILS_QUERY, PROBLEM_DETAIL_QUERY } from "./queries";
import {
  LeetCodeSubmissionSchema,
  LeetCodeSubmission,
  LeetCodeProblemSchema,
  LeetCodeProblem,
} from "../schema/leetcodeClient.schema";

export class LeetCodeClient {
  private readonly graphqlEndpoint = "https://leetcode.com/graphql/";
  private async graphqlRequest<T>(
    query: string,
    variables: Record<string, unknown> = {},
  ): Promise<T> {
    const response = await fetch(this.graphqlEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`LeetCode API HTTP Error: ${response.status}`);
    }

    const json = (await response.json()) as {
      data?: T;
      errors?: Array<{ message: string }>;
    };

    if (json.errors?.length) {
      throw new Error(
        "GraphQL Errors: " + json.errors.map((e) => e.message).join(" | "),
      );
    }

    if (!json.data) {
      throw new Error("GraphQL returned empty data object.");
    }

    return json.data;
  }

  public async getSubmissionDetail(
    submissionId: number,
  ): Promise<LeetCodeSubmission> {
    try {
      const rawData = await this.graphqlRequest<unknown>(
        SUBMISSION_DETAILS_QUERY,
        { submissionId },
      );
      const validData = LeetCodeSubmissionSchema.parse(rawData);
      return validData;
    } catch (error) {
      console.error(`❌ Failed to process submission ${submissionId}:`, error);
      throw error;
    }
  }

  public async getProblemDetail(titleSlug: string): Promise<LeetCodeProblem["question"]> {
    try {
      const rawData = await this.graphqlRequest<unknown>(
        PROBLEM_DETAIL_QUERY,
        { titleSlug },
      );
      const validData = LeetCodeProblemSchema.parse(rawData);
      return validData.question;
    } catch (error) {
      console.error(`❌ Failed to process problem ${titleSlug}:`, error);
      throw error;
    }
  }
}

export const leetcodeClient = new LeetCodeClient();
