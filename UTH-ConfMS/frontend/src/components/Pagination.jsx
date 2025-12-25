import React from 'react';

const Pagination = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    itemName = "mục"
}) => {
    if (totalItems === 0) return null;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    return (
        <div className="pagination-wrapper">
            <div className="pagination-info">
                Hiển thị {startIndex + 1}-{endIndex} trong tổng số {totalItems} {itemName}
            </div>
            <div className="pagination-controls">
                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                >
                    Đầu
                </button>
                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    Trước
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
                    Sau
                </button>
                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                >
                    Cuối
                </button>
            </div>
        </div>
    );
};

export default Pagination;
