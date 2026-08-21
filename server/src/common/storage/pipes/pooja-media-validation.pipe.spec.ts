import { BadRequestException } from '@nestjs/common';
import { PoojaMediaValidationPipe } from './pooja-media-validation.pipe';

describe('PoojaMediaValidationPipe', () => {
  const pipe = new PoojaMediaValidationPipe();

  it('accepts a valid optional MP3 mantra file', () => {
    const media = {
      mantraAudio: [
        {
          buffer: Buffer.from('ID3audio'),
          mimetype: 'audio/mpeg',
          originalname: 'mantra.mp3',
        },
      ],
    };

    expect(pipe.transform(media)).toBe(media);
  });

  it('rejects audio whose content does not match its MIME type', () => {
    expect(() =>
      pipe.transform({
        mantraAudio: [
          {
            buffer: Buffer.from('not-an-mp3'),
            mimetype: 'audio/mpeg',
            originalname: 'mantra.mp3',
          },
        ],
      }),
    ).toThrow(BadRequestException);
  });
});
