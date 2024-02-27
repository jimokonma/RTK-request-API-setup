import {
  BaseQueryApi,
  FetchArgs,
  createApi,
  fetchBaseQuery,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { setIsAuth, logOut } from "@/lib/redux/slices/authSlice/isAuthSlice";
import type { ReduxState } from "@/lib/redux/store";
// import { endpoints } from "@/app/utility/endpoints";// add your endpoints file with baseUrl

const baseQuery = fetchBaseQuery({
  baseUrl: endpoints.baseUrl,
  prepareHeaders: (headers, { getState }) => {
    // Get the accessToken from the Redux store
    const authState = (getState() as ReduxState).isAuth;
    const userState = (getState() as ReduxState).user;

    const accessToken = authState.accessToken;
    const refreshToken = authState.refreshToken;
    const email = userState?.email;

    if (accessToken) {
      headers.set("Authorization", accessToken);
      if (refreshToken !== null) {
        headers.set("user-token", refreshToken);
      }
      headers.set("user-email", email);
    }
  },
});

const baseQueryWithReauth = async (
  args: string | FetchArgs,
  api: BaseQueryApi,
  extraOptions: {}
) => {
  let result = await baseQuery(args, api, extraOptions);

  if (
    (result.error && (result.error as FetchBaseQueryError).status === 403) ||
    (result.error && (result.error as FetchBaseQueryError).status === 401)
  ) {
    // try to get a new token
    const refreshResult = await baseQuery("", api, extraOptions);

    if (refreshResult.data) {
      const { accessToken, refreshToken } = refreshResult.data as {
        accessToken: string;
        refreshToken: string;
      };
      // store the new token
      api.dispatch(
        setIsAuth({
          isAuth: true,
          accessToken,
          refreshToken,
        })
      );
      // retry the initial query
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logOut());
    }
  }
  return result;
};

export const request = createApi({
  reducerPath: "request",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    getData: builder.query({
      query: (url) => url,
    }),
    sendData: builder.mutation({
      query: ({ url, data, type }) => ({
        url: url,
        method: type,
        body: data,
      }),
      transformResponse: (response) => {
        // Do any necessary data transformation
        return response;
      },
    }),
  }),
});

export const { useSendDataMutation, useGetDataQuery } = request;
