export type ProgressEventBase = {
  timestamp: string;
};

export type ProgressEvent =
  | (ProgressEventBase & {
      type: "log";
      message: string;
      boardId?: number;
      keywordId?: number;
    })
  | (ProgressEventBase & {
      type: "board_start";
      boardId: number;
      boardName: string;
    })
  | (ProgressEventBase & {
      type: "board_done";
      boardId: number;
      scraped: number;
      new: number;
    })
  | (ProgressEventBase & {
      type: "keyword_start";
      boardId: number;
      keywordId: number;
      keyword: string;
    })
  | (ProgressEventBase & {
      type: "selector_required";
      boardId: number;
      boardName: string;
      screenshotBase64: string;
    })
  | (ProgressEventBase & {
      type: "run_complete";
      runId: number;
      totalScraped: number;
      totalNew: number;
      totalMatched: number;
    })
  | (ProgressEventBase & {
      type: "matching_start";
      runId: number;
    })
  | (ProgressEventBase & {
      type: "matching_phase";
      phase: 1 | 2 | 3;
      status: string;
      detail?: string;
    })
  | (ProgressEventBase & {
      type: "matching_batch";
      batch: number;
      totalBatches: number;
      jobCount: number;
    })
  | (ProgressEventBase & {
      type: "matching_complete";
      runId: number;
      totalMatched: number;
    })
  | (ProgressEventBase & {
      type: "run_error";
      message: string;
    });
