import React from 'react';
import { useTranslation } from 'react-i18next';

const Pagination = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    itemName
}) => {
    const { t } = useTranslation();
    
    if (totalItems === 0) return null;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const displayItemName = itemName || t('pagination.items');

    return (
        <div className="pagination-wrapper">
            <div className="pagination-info">
                {t('pagination.showing')} {startIndex + 1}-{endIndex} {t('pagination.of')} {totalItems} {displayItemName}
            </div>
            <div className="pagination-controls">
                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                >
                    {t('pagination.first')}
                </button>
                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    {t('pagination.prev')}
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                        return page === 1 ||
                            page === totalPages ||
                            Math.abs(page - currentPage) <= 2;
                    })
                    .map((page, index, array) => {
                        const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                        return (
                            <React.Fragment key={page}>
                                {showEllipsisBefore && <span className="pagination-ellipsis">...</span>}
                                <button
                                    className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                                    onClick={() => onPageChange(page)}
                                >
                                    {page}
                                </button>
                            </React.Fragment>
                        );
                    })}

                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    {t('pagination.next')}
                </button>
                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                >
                    {t('pagination.last')}
                </button>
            </div>
        </div>
    );
};

export default Pagination;
