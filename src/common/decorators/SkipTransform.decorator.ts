import { SetMetadata } from '@nestjs/common';

export const SKIP_TRANSFORM_KEY = 'skip_transform';

export const SkipTransform = () => SetMetadata(SKIP_TRANSFORM_KEY, true);
