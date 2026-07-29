import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Question title is required'],
      minlength: [15, 'Title must be at least 15 characters'],
      maxlength: [150, 'Title must be at most 150 characters'],
      trim: true,
    },
    body: {
      type: String,
      required: [true, 'Question body is required'],
      minlength: [30, 'Body must be at least 30 characters'],
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: 'A question can have at most 5 tags',
      },
    },
    answers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Answer',
      },
    ],
    acceptedAnswer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Answer',
      default: null,
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    downvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
    isReported: {
      type: Boolean,
      default: false,
    },
    isAI: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

questionSchema.virtual('score').get(function () {
  return (this.upvotes?.length || 0) - (this.downvotes?.length || 0);
});

questionSchema.virtual('answerCount').get(function () {
  return this.answers?.length || 0;
});

questionSchema.set('toJSON', { virtuals: true });

questionSchema.index({ title: 'text', body: 'text', tags: 'text' });
questionSchema.index({ createdAt: -1 });
questionSchema.index({ tags: 1 });

export default mongoose.model('Question', questionSchema);
