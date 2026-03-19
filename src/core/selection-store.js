export function createSelectionStore(bookmarkUrlById) {
  const selectedIds = new Set();

  function setSelection(id, shouldSelect) {
    if (!bookmarkUrlById.has(id)) return;
    shouldSelect ? selectedIds.add(id) : selectedIds.delete(id);
  }

  function clearSelection() {
    selectedIds.clear();
  }

  function setSelectionMany(ids, shouldSelect) {
    if (shouldSelect) {
      for (const id of ids) {
        bookmarkUrlById.has(id) && selectedIds.add(id);
      }
    } else {
      for (const id of ids) {
        selectedIds.delete(id);
      }
    }
  }

  function getSelectedIds() {
    return [...selectedIds];
  }

  function getSelectedUrls() {
    const urls = [];
    for (const id of selectedIds) {
      const url = bookmarkUrlById.get(id);
      url && urls.push(url);
    }
    return urls;
  }

  function getSelectedCount() {
    return selectedIds.size;
  }

  function isSelected(id) {
    return selectedIds.has(id);
  }

  function getSelectionStats(ids) {
    if (!ids.length) {
      return { selectedCount: 0, totalCount: 0, checked: false, indeterminate: false };
    }
    let selectedCount = 0;
    for (const id of ids) {
      selectedIds.has(id) && selectedCount++;
    }
    const totalCount = ids.length;
    return {
      selectedCount,
      totalCount,
      checked: selectedCount === totalCount,
      indeterminate: selectedCount > 0 && selectedCount < totalCount
    };
  }

  return {
    setSelection,
    setSelectionMany,
    clearSelection,
    getSelectedIds,
    getSelectedUrls,
    getSelectedCount,
    isSelected,
    getSelectionStats
  };
}
