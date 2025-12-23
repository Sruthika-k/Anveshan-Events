function TeamCardSkeleton({ count = 3 }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden animate-pulse"
                >
                    {/* Header Skeleton */}
                    <div className="px-6 py-4 bg-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gray-300 rounded"></div>
                                <div className="h-6 bg-gray-300 rounded w-32"></div>
                            </div>
                            <div className="h-4 bg-gray-300 rounded w-20"></div>
                        </div>
                    </div>

                    {/* Score Circle Skeleton */}
                    <div className="px-6 py-8 flex flex-col items-center">
                        <div className="w-32 h-32 bg-gray-200 rounded-full mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>

                    {/* Skills Skeleton */}
                    <div className="px-6 py-4 space-y-4 border-t border-gray-200">
                        <div>
                            <div className="h-4 bg-gray-200 rounded w-40 mb-2"></div>
                            <div className="flex flex-wrap gap-2">
                                <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                                <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                                <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                            </div>
                        </div>
                        <div>
                            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                            <div className="flex flex-wrap gap-2">
                                <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                                <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                            </div>
                        </div>
                    </div>

                    {/* Reasons Skeleton */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <div className="h-4 bg-gray-200 rounded w-36 mb-2"></div>
                        <div className="space-y-2 ml-7">
                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                            <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                    </div>

                    {/* Buttons Skeleton */}
                    <div className="px-6 py-4 bg-white border-t border-gray-200 flex gap-3">
                        <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
                        <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default TeamCardSkeleton;
