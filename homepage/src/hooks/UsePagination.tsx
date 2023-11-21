import { useState, useCallback } from 'react';

const usePagination = (items: any, pageSize: any) => {
  const [page, setPage] = useState(1);

  const isPrevPageAvailable = page > 1;
  const isNextPageAvailable = page * pageSize < items.length;

  const goToNextPage = useCallback(() => {
    setPage((prevPage) => (isNextPageAvailable ? prevPage + 1 : prevPage));
  }, [isNextPageAvailable]);

  const goToPrevPage = useCallback(() => {
    setPage((prevPage) => (isPrevPageAvailable ? prevPage - 1 : prevPage));
  }, [isPrevPageAvailable]);

  return {
    page,
    setPage,
    isNextPageAvailable,
    isPrevPageAvailable,
    goToNextPage,
    goToPrevPage,
  };
};

export default usePagination;
