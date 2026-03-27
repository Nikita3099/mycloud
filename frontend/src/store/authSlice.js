import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../api/client";

export const initCsrf = createAsyncThunk("auth/initCsrf", async () => {
  await api.get("/api/csrf/");
  return true;
});

export const loadMe = createAsyncThunk("auth/loadMe", async (_, { rejectWithValue }) => {
  try {
    const user = await api.get("/api/me/");
    return user;
  } catch (e) {
    if (e?.status === 401 || e?.status === 403) return null;
    return rejectWithValue(e.data || { error: e.message });
  }
});

export const registerUser = createAsyncThunk("auth/register", async (payload, { rejectWithValue }) => {
  try {
    await api.post("/api/register/", payload);
    return true;
  } catch (e) {
    return rejectWithValue(e.data || { error: e.message });
  }
});

export const loginUser = createAsyncThunk("auth/login", async (payload, { rejectWithValue }) => {
  try {
    await api.post("/api/login/", payload);
    const user = await api.get("/api/me/");
    return user;
  } catch (e) {
    return rejectWithValue(e.data || { error: e.message });
  }
});

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  await api.post("/api/logout/");
  return true;
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadMe.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loadMe.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
      })
      .addCase(loadMe.rejected, (state, action) => {
        state.status = "failed";
        state.user = null;
        state.error = action.payload?.error || "Failed to load user";
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.error = action.payload?.error || "Login failed";
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.error = null;
        state.status = "idle";
      });
  },
});

export default authSlice.reducer;

