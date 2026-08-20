export default function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="w-8 h-8 rounded-full border-[3px] border-gray-200 dark:border-slate-800 border-t-yellow-500 dark:border-t-yellow-500 animate-spin"></div>
    </div>
  );
}
