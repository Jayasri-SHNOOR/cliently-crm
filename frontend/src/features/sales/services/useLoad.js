import { useEffect, useState } from "react";
import { errorMessage } from "./salesApi";

export default function useLoad(fetcher) {
    const [key, setKey] = useState(0);
    const [state, setState] = useState({ key: -1, data: null, error: "" });

    useEffect(() => {
        let active = true;
        fetcher()
            .then((data) => {
                if (active) setState({ key, data, error: "" });
            })
            .catch((err) => {
                if (active) setState({ key, data: null, error: errorMessage(err) });
            });
        return () => {
            active = false;
        };
    }, [fetcher, key]);

    return {
        loading: state.key !== key,
        error: state.error,
        data: state.data,
        reload: () => setKey((value) => value + 1),
    };
}
