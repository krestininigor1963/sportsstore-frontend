"use client ";

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  page,
  pageCount,
  onPageChange,
}: PaginationProps) {
  if (pageCount <= 1) return null;
  return (
    <>
      <div className="pagination">
        <button
          className="btn"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          Назад
        </button>

        <span className="pagination-info">
          Страница {page} из {pageCount}
        </span>

        <button
          className="btn"
          disabled={page === pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Вперед
        </button>
      </div>
    </>
  );
}
