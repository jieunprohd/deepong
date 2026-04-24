import {snakeCase} from 'lodash';

export class Handle {
    private constructor(readonly value: string) {
    }

    public static generate(nickname: string): Handle {
        const slug = snakeCase(nickname).toLowerCase();
        const hex = Math.floor(Math.random() * 0xffff)
            .toString(16)
            .padStart(4, '0');
        return new Handle(`${slug}#${hex}`);
    }

    public static async generateUnique(
        nickname: string,
        existsFn: (handle: string) => Promise<boolean>,
        retryLimit = 5,
    ): Promise<Handle> {
        for (let i = 0; i < retryLimit; i++) {
            const candidate = Handle.generate(nickname);
            if (!await existsFn(candidate.value)) {
                return candidate;
            }
        }
        return Handle.generate(nickname + Date.now());
    }

    public static from(value: string): Handle {
        return new Handle(value);
    }

    public equals(other: Handle): boolean {
        return this.value === other.value;
    }
}
