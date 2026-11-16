// The Compose side of the docs, loaded lazily so the Kotlin sources and the API table stay out of the initial chunk.
// The Compose versions of the examples, compiled with the sample app so they cannot drift from the Kotlin API.
import ktSource from '../../../../compose/sample/src/commonMain/kotlin/uz/kometa/sample/Docs.kt' with { loader: 'text' };
import ktFormA from '../../../../compose/sample/src/commonMain/kotlin/uz/kometa/sample/DocsFormA.kt' with { loader: 'text' };
import ktFormB from '../../../../compose/sample/src/commonMain/kotlin/uz/kometa/sample/DocsFormB.kt' with { loader: 'text' };
import ktActions from '../../../../compose/sample/src/commonMain/kotlin/uz/kometa/sample/DocsActions.kt' with { loader: 'text' };
import ktData from '../../../../compose/sample/src/commonMain/kotlin/uz/kometa/sample/DocsData.kt' with { loader: 'text' };
import ktOverlays from '../../../../compose/sample/src/commonMain/kotlin/uz/kometa/sample/DocsOverlays.kt' with { loader: 'text' };
import ktMedia from '../../../../compose/sample/src/commonMain/kotlin/uz/kometa/sample/DocsMedia.kt' with { loader: 'text' };
import ktMisc from '../../../../compose/sample/src/commonMain/kotlin/uz/kometa/sample/DocsMisc.kt' with { loader: 'text' };

export { default as composeApi } from './compose-api.json';

export const kotlinSource = [ktSource, ktFormA, ktFormB, ktActions, ktData, ktOverlays, ktMedia, ktMisc].join('\n');
