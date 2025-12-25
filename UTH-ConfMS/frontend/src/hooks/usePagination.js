import { useState, useEffect } from 'react';

export const usePagination = (items, itemsPerPage = 20) => {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(items.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = items.slice(startIndex, endIndex);

    // Reset to page 1 when items change, but only if current page is out of bounds
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [items.length, currentPage, totalPages]);

    return {
        currentPage,
        setCurrentPage,
        totalPages,
        paginatedItems,
        startIndex,
        endIndex
    };
};
