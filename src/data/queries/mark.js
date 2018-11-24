import {
  GraphQLString as StringType,
  GraphQLList as List,
  GraphQLFloat as FloatType,
  GraphQLNonNull as NonNull,
} from 'graphql';
import MarkType from '../types/MarkType';
import Mark from '../models/Mark';

const createMark = {
  type: MarkType,
  args: {
    mark: {
      description: 'The mark of the new mark',
      type: new NonNull(FloatType),
    },
    comment: {
      description: 'The comment of the mark',
      type: StringType,
    },
    answerId: {
      description: 'The answerId of the mark',
      type: new NonNull(StringType),
    },
  },
  resolve({ request }, args) {
    return Mark.create({
      ...args,
      authorId: request.user.id,
    });
  },
};

const marks = {
  type: new List(MarkType),
  args: {
    ids: {
      description: 'ids of the marks',
      type: new List(StringType),
    },
  },
  resolve(obj, args) {
    const where = {};
    if (args.ids) {
      where.id = args.ids;
    }
    return Mark.findAll({ where });
  },
};

const updateMark = {
  type: MarkType,
  args: {
    id: {
      description: 'id of the mark',
      type: new NonNull(StringType),
    },
    mark: {
      description: 'The grade of the mark',
      type: FloatType,
    },
    comment: {
      description: 'The comment of the mark',
      type: StringType,
    },
  },
  resolve(parent, { id, ...rest }) {
    return Mark.findById(id).then(mark => mark.update({ ...rest }));
  },
};

export { createMark, marks, updateMark };
