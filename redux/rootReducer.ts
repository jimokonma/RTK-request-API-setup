import { request } from "@/lib/redux/slices/requestSlice/requestSlice";

export const reducer = {
  [request.reducerPath]: request.reducer,
};
