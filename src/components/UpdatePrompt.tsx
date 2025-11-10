interface UpdatePromptProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

export function UpdatePrompt({ onUpdate, onDismiss }: UpdatePromptProps) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <div className="bg-blue-600 text-white rounded-xl shadow-lg p-4 flex items-center gap-3">
        <div className="flex-1">
          <p className="font-medium">New version available!</p>
          <p className="text-sm text-blue-100">Update now to get the latest features</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors"
          >
            Later
          </button>
          <button
            onClick={onUpdate}
            className="px-3 py-1.5 text-sm bg-white text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
