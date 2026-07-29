import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { questionsAPI } from '../../services/questions.service';

export const fetchQuestions = createAsyncThunk('qa/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const res = await questionsAPI.getAll(params);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchQuestion = createAsyncThunk('qa/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await questionsAPI.getOne(id);
    return res.data.question;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const createQuestion = createAsyncThunk('qa/create', async (data, { rejectWithValue }) => {
  try {
    const res = await questionsAPI.create(data);
    return res.data.question;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to post question');
  }
});

export const addAnswer = createAsyncThunk('qa/addAnswer', async ({ id, body }, { rejectWithValue }) => {
  try {
    const res = await questionsAPI.addAnswer(id, body);
    return { questionId: id, answer: res.data.answer };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const acceptAnswer = createAsyncThunk('qa/accept', async ({ qId, aId }, { rejectWithValue }) => {
  try {
    await questionsAPI.acceptAnswer(qId, aId);
    return { qId, aId };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchTrendingTags = createAsyncThunk('qa/tags', async (_, { rejectWithValue }) => {
  try {
    const res = await questionsAPI.getTrendingTags();
    return res.data.tags;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const qaSlice = createSlice({
  name: 'qa',
  initialState: {
    questions: [],
    currentQuestion: null,
    trendingTags: [],
    page: 1,
    totalPages: 1,
    loading: false,
    questionLoading: false,
    creating: false,
    error: null,
  },
  reducers: {
    clearCurrentQuestion: (state) => { state.currentQuestion = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuestions.pending, (state) => { state.loading = true; })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = action.payload.questions;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })

      .addCase(fetchQuestion.pending, (state) => { state.questionLoading = true; })
      .addCase(fetchQuestion.fulfilled, (state, action) => {
        state.questionLoading = false; state.currentQuestion = action.payload;
      })
      .addCase(fetchQuestion.rejected, (state) => { state.questionLoading = false; })

      .addCase(createQuestion.pending, (state) => { state.creating = true; })
      .addCase(createQuestion.fulfilled, (state, action) => {
        state.creating = false;
        state.questions.unshift(action.payload);
      })
      .addCase(createQuestion.rejected, (state, action) => {
        state.creating = false; state.error = action.payload;
      })

      .addCase(addAnswer.fulfilled, (state, action) => {
        if (state.currentQuestion?._id === action.payload.questionId) {
          state.currentQuestion.answers.push(action.payload.answer);
        }
      })

      .addCase(acceptAnswer.fulfilled, (state, action) => {
        if (state.currentQuestion) {
          state.currentQuestion.acceptedAnswer = action.payload.aId;
          state.currentQuestion.answers = state.currentQuestion.answers.map((a) => ({
            ...a,
            isAccepted: a._id === action.payload.aId,
          }));
        }
      })

      .addCase(fetchTrendingTags.fulfilled, (state, action) => {
        state.trendingTags = action.payload;
      });
  },
});

export const { clearCurrentQuestion } = qaSlice.actions;
export const selectQuestions = (state) => state.qa.questions;
export const selectCurrentQuestion = (state) => state.qa.currentQuestion;
export const selectTrendingTags = (state) => state.qa.trendingTags;
export const selectQALoading = (state) => state.qa.loading;
export const selectQuestionLoading = (state) => state.qa.questionLoading;

export default qaSlice.reducer;
