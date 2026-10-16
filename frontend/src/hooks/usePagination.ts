import { useState, useMemo } from 'react';

export function usePagination(initialPage = 0, initialSize = 20) {
  const [page, setPage] = useState(initialPage);
  const [size, setSize] = useState(initialSize);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const canNext = useMemo(() => page < totalPages - 1, [page, totalPages]);
  const canPrev = useMemo(() => page > 0, [page]);

  const nextPage = () => {
    if (canNext) setPage((p) => p + 1);
  };

  const prevPage = () => {
    if (canPrev) setPage((p) => p - 1);
  };

  const goToPage = (p: number) => {
    if (p >= 0 && p < totalPages) {
      setPage(p);
    }
  };

  return {
    page,
    size,
    totalPages,
    totalElements,
    canNext,
    canPrev,
    setPage,
    setSize,
    setTotalPages,
    setTotalElements,
    nextPage,
    prevPage,
    goToPage,
  };
}
