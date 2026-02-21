// This file re-exports from create-practice-dialog-v2 to satisfy any stale imports
export { CreatePracticeDialog } from "./create-practice-dialog-v2"
export default function CreatePracticeDialogDefault(props: { open: boolean; onOpenChange: (open: boolean) => void; onSuccess?: () => void }) {
  return <CreatePracticeDialog {...props} />
}
