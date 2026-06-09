import React, { useCallback, useEffect, useState } from "react";
import BoardForm, { type BoardFormValues } from "@/components/boards/BoardForm";
import BoardList from "@/components/boards/BoardList";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BoardsDbError,
  createBoard,
  deleteBoard,
  listBoards,
  updateBoard,
} from "@/lib/boards-db";
import type { Board } from "@/types/board";
import { cn } from "@/lib/utils";

function toFormValues(board: Board): BoardFormValues {
  return {
    name: board.name,
    url: board.url,
    searchSelector: board.search_selector ?? "",
  };
}

function BoardsScreen(): React.JSX.Element {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Board | null>(null);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const refreshBoards = useCallback(async (): Promise<void> => {
    const rows = await listBoards();
    setBoards(rows);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadBoards(): Promise<void> {
      try {
        const rows = await listBoards();
        if (!cancelled) {
          setBoards(rows);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof BoardsDbError ? err.message : "Unable to load boards";
          setError(message);
          setBoards([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadBoards();

    return () => {
      cancelled = true;
    };
  }, []);

  const openCreateDialog = useCallback((): void => {
    setEditingBoard(null);
    setFormError(null);
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((board: Board): void => {
    setEditingBoard(board);
    setFormError(null);
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback((): void => {
    if (pending) {
      return;
    }
    setDialogOpen(false);
    setEditingBoard(null);
    setFormError(null);
  }, [pending]);

  const handleFormSubmit = useCallback(
    async (values: BoardFormValues): Promise<void> => {
      setPending(true);
      setFormError(null);

      try {
        if (editingBoard === null) {
          await createBoard({
            name: values.name,
            url: values.url,
            searchSelector: values.searchSelector,
          });
        } else {
          await updateBoard(editingBoard.id, {
            name: values.name,
            url: values.url,
            searchSelector: values.searchSelector,
          });
        }

        await refreshBoards();
        setDialogOpen(false);
        setEditingBoard(null);
        setError(null);
      } catch (err) {
        const message =
          err instanceof BoardsDbError ? err.message : "Unable to save board";
        setFormError(message);
      } finally {
        setPending(false);
      }
    },
    [editingBoard, refreshBoards]
  );

  const handleDeleteConfirm = useCallback(async (): Promise<void> => {
    if (deleteTarget === null) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      await deleteBoard(deleteTarget.id);
      await refreshBoards();
      setDeleteTarget(null);
    } catch (err) {
      const message =
        err instanceof BoardsDbError ? err.message : "Unable to delete board";
      setError(message);
      setDeleteTarget(null);
    } finally {
      setPending(false);
    }
  }, [deleteTarget, refreshBoards]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Boards</h1>
        <Button type="button" onClick={openCreateDialog}>
          Add board
        </Button>
      </div>

      {error !== null ? (
        <div
          className={cn("rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive")}
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading boards…</p>
      ) : (
        <BoardList
          boards={boards}
          onEdit={openEditDialog}
          onDelete={setDeleteTarget}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent showCloseButton={!pending}>
          <DialogHeader>
            <DialogTitle>
              {editingBoard === null ? "Add board" : "Edit board"}
            </DialogTitle>
          </DialogHeader>
          <BoardForm
            initialValues={
              editingBoard === null ? undefined : toFormValues(editingBoard)
            }
            submitLabel={editingBoard === null ? "Add board" : "Save changes"}
            pending={pending}
            onSubmit={(values) => {
              void handleFormSubmit(values);
            }}
            onCancel={closeDialog}
          />
          {formError !== null ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !pending) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete board?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget !== null
                ? `This will permanently remove "${deleteTarget.name}".`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={() => {
                void handleDeleteConfirm();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default BoardsScreen;
