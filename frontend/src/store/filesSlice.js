import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../api/client";

export const fetchFiles = createAsyncThunk(
  "files/fetchFiles",
  async ({ userId } = {}, { rejectWithValue }) => {
    try {
      const params = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
      const files = await api.get(`/api/files/${params}`);
      return files;
    } catch (e) {
      return rejectWithValue(e.data || { error: e.message });
    }
  }
);

export const uploadFile = createAsyncThunk(
  "files/uploadFile",
  async ({ file, comment, userId }, { rejectWithValue, dispatch }) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("comment", comment || "");
    await api.post("/api/files/upload/", formData, true);
    dispatch(fetchFiles({ userId }));
    return true;
  } catch (e) {
    return rejectWithValue(e.data || { error: e.message });
  }
}
);

export const updateFile = createAsyncThunk(
  "files/updateFile",
  async ({ fileId, original_name, comment, userId }, { rejectWithValue, dispatch }) => {
    try {
      await api.patch(`/api/files/${fileId}/`, { original_name, comment });
      dispatch(fetchFiles({ userId }));
      return true;
    } catch (e) {
      return rejectWithValue(e.data || { error: e.message });
    }
  }
);

export const deleteFile = createAsyncThunk(
  "files/deleteFile",
  async ({ fileId, userId }, { rejectWithValue, dispatch }) => {
  try {
    await api.delete(`/api/files/${fileId}/`);
    dispatch(fetchFiles({ userId }));
    return true;
  } catch (e) {
    return rejectWithValue(e.data || { error: e.message });
  }
});

const filesSlice = createSlice({
  name: "files",
  initialState: {
    items: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFiles.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.error || "Failed to fetch files";
      });
  },
});

export default filesSlice.reducer;

