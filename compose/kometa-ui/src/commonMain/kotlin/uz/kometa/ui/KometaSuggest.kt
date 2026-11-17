package uz.kometa.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupPositionProvider
import androidx.compose.ui.window.PopupProperties
import kotlinx.coroutines.delay

/** One row offered by [KometaSuggest]: the [label] drawn and put in the field once picked, a quiet [meta] line (a phone), and your [data]. */
public data class KometaSuggestion(val label: String, val meta: String = "", val data: Any? = null)

/** Whether [text] is long enough to ask for suggestions: [minLength] letters, not counting spaces at the ends. */
internal fun suggestAsks(text: String, minLength: Int): Boolean = text.trim().length >= minLength

/**
 * A text field that offers people while you type (`k-suggest`), drawn as a [KometaField]; free text
 * always, a word nobody has is simply what was typed. From [minLength] letters, after [delayMillis]
 * of quiet, [onQuery] gets the trimmed text and the page answers by setting [suggestions]; a new list
 * opens a glass panel under the field (above when there is no room) while the field keeps focus.
 * Arrow keys move over the rows, Enter picks, Escape, Tab or a tap outside closes. A pick puts its
 * label in the field ([onValueChange]) and hands the row to [onPick]. Rows draw as a small
 * [KometaPerson] unless [row] draws them. [label] is the field's label and accessible name.
 */
@Composable
public fun KometaSuggest(
    value: String,
    onValueChange: (String) -> Unit,
    suggestions: List<KometaSuggestion>,
    onQuery: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    onPick: (KometaSuggestion) -> Unit = {},
    placeholder: String = label,
    minLength: Int = 2,
    delayMillis: Long = 300,
    enabled: Boolean = true,
    readOnly: Boolean = false,
    row: (@Composable (KometaSuggestion) -> Unit)? = null,
) {
    val c = Kometa.colors
    // asked: the text waiting out the delay; shown: a query went out, so rows that come back open the list.
    var asked by remember { mutableStateOf<String?>(null) }
    var shown by remember { mutableStateOf(false) }
    var active by remember { mutableIntStateOf(-1) }
    var width by remember { mutableIntStateOf(0) }
    val ask by rememberUpdatedState(onQuery)
    val density = LocalDensity.current
    LaunchedEffect(asked) {
        val text = asked ?: return@LaunchedEffect
        delay(delayMillis)
        shown = true
        ask(text.trim())
    }
    LaunchedEffect(suggestions) { active = -1 }
    val open = shown && suggestions.isNotEmpty()

    fun close() { shown = false; asked = null }
    fun pick(s: KometaSuggestion) { onValueChange(s.label); onPick(s); close() }

    Box(
        modifier
            .onSizeChanged { width = it.width }
            .onPreviewKeyEvent { e ->
                if (e.type != KeyEventType.KeyDown || !open) return@onPreviewKeyEvent false
                val n = suggestions.size
                when (e.key) {
                    Key.DirectionDown -> { active = stepRow(active, 1, n); true }
                    Key.DirectionUp -> { active = stepRow(active, -1, n); true }
                    Key.Enter, Key.NumPadEnter -> if (active in 0 until n) { pick(suggestions[active]); true } else false
                    Key.Escape -> { close(); true }
                    Key.Tab -> { close(); false }
                    else -> false
                }
            },
    ) {
        KometaField(
            value = value,
            onValueChange = { t -> onValueChange(t); if (suggestAsks(t, minLength)) asked = t else close() },
            label = label,
            placeholder = placeholder,
            enabled = enabled,
            readOnly = readOnly,
        )

        if (open) {
            val gap = with(density) { 6.dp.roundToPx() }
            val pad = with(density) { 8.dp.roundToPx() }
            val place = remember(gap, pad) {
                object : PopupPositionProvider {
                    override fun calculatePosition(anchorBounds: IntRect, windowSize: IntSize, layoutDirection: LayoutDirection, popupContentSize: IntSize) =
                        placeBelowOrAbove(anchorBounds, windowSize, popupContentSize, gap, pad)
                }
            }
            val grow = remember { Animatable(0f) }
            LaunchedEffect(Unit) { grow.animateTo(1f, tween(320, easing = SpringEase)) }
            // Not focusable, so typing goes on in the field under it.
            // shortcut: a tap on the field itself also counts as outside and closes the list (the web keeps it), the next letter reopens it.
            Popup(popupPositionProvider = place, onDismissRequest = { close() }, properties = PopupProperties(focusable = false)) {
                val shape = RoundedCornerShape(18.dp)
                Column(
                    Modifier
                        .graphicsLayer {
                            val t = grow.value
                            scaleX = .96f + .04f * t
                            scaleY = scaleX
                            alpha = (t * 1.6f).coerceIn(0f, 1f)
                        }
                        .width(maxOf(240.dp, with(density) { width.toDp() }))
                        .heightIn(max = 320.dp)
                        .clip(shape)
                        .background(c.card, shape)
                        .border(1.dp, c.glassLine, shape)
                        .verticalScroll(rememberScrollState())
                        .padding(6.dp)
                        .semantics { paneTitle = label },
                    verticalArrangement = Arrangement.spacedBy(2.dp),
                ) {
                    suggestions.forEachIndexed { i, s ->
                        Box(
                            Modifier
                                .fillMaxWidth()
                                .defaultMinSize(minHeight = 52.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (i == active) c.glassLine else Color.Transparent)
                                .clickable(role = Role.Button) { pick(s) }
                                .padding(horizontal = 10.dp),
                            contentAlignment = Alignment.CenterStart,
                        ) {
                            if (row != null) row(s) else KometaPerson(s.label, meta = s.meta, size = KometaPersonSize.Sm)
                        }
                    }
                }
            }
        }
    }
}
