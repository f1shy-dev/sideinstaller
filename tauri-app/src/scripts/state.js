const ArrayStore = () => {
    let _state = []
    const Store = {
        get: () => _state.map(s => ({ ...s })),
        set: state => (_state = state.map(s => ({ ...s }))),
    }
    return Object.freeze(Store)
};

const ObjectStore = () => {
    let _state = {}
    const Store = {
        get: () => ({ ..._state }),
        set: state => (_state = { ...state }),
    }
    return Object.freeze(Store)
};
export { ArrayStore, ObjectStore };