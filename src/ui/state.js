export function createUiState(initialValues = {}) {
  let state = {
    nodes: [],
    query: "",
    settings: {},
    rootFolderId: "",
    ...initialValues
  };

  return {
    getState() {
      return state;
    },
    setState(patch) {
      state = { ...state, ...patch };
      return state;
    }
  };
}
