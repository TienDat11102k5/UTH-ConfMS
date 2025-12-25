import { useState, useEffect } from 'react';

export const usePagination = (items, itemsPerPage = 20) => {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(items.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = items.slice(startIndex, endIndex);

    // Reset to page 1 when items change
    useEffect(() => {
        setCurrentPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items.length]);

    return {
        currentPage,
        setCurrentPage,
        totalPages,
        paginatedItems,
        startIndex,
        endIndex
    };
};
