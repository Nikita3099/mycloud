import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../api/client";

function isAdminState(getState) {
  const state = getState?.();
  return !!state?.auth?.user?.is_admin;
}

export const fetchUsers = createAsyncThunk("users/fetchUsers", async (_, { rejectWithValue, getState }) => {
  if (!isAdminState(getState)) {
    return rejectWithValue({ error: "Admin access required" });
  }
  try {
    const users = await api.get("/api/users/");
    return users;
  } catch (e) {
    return rejectWithValue(e.data || { error: e.message });
  }
});

export const updateUserAdmin = createAsyncThunk(
  "users/updateUserAdmin",
  async ({ userId, is_admin }, { dispatch, rejectWithValue, getState }) => {
    if (!isAdminState(getState)) {
      return rejectWithValue({ error: "Admin access required" });
    }
    try {
      await api.patch(`/api/users/${userId}/`, { is_admin });
      dispatch(fetchUsers());
      return true;
    } catch (e) {
      return rejectWithValue(e.data || { error: e.message });
    }
  }
);

export const deleteUser = createAsyncThunk("users/deleteUser", async (userId, { dispatch, rejectWithValue, getState }) => {
  if (!isAdminState(getState)) {
    return rejectWithValue({ error: "Admin access required" });
  }
  try {
    await api.delete(`/api/users/${userId}/delete/`);
    dispatch(fetchUsers());
    return true;
  } catch (e) {
    return rejectWithValue(e.data || { error: e.message });
  }
});

const usersSlice = createSlice({
  name: "users",
  initialState: {
    items: [],
    status: "idle",
    error: null,
    updating: false,
    deleting: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.error || "Failed to fetch users";
      })
      .addCase(updateUserAdmin.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateUserAdmin.fulfilled, (state) => {
        state.updating = false;
      })
      .addCase(updateUserAdmin.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload?.error || "Failed to update user";
      })
      .addCase(deleteUser.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state) => {
        state.deleting = false;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload?.error || "Failed to delete user";
      });
  },
});

export const { clearError } = usersSlice.actions;

export default usersSlice.reducer;

