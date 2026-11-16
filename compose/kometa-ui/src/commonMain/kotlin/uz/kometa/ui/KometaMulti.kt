package uz.kometa.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupPositionProvider
import androidx.compose.ui.window.PopupProperties

/** The options whose label holds [query] (trimmed, any case); every option for a blank query. */
internal fun <T> matchOptions(options: List<T>, label: (T) -> String, query: String): List<T> {
    val q = query.trim().lowercase()
    return if (q.isEmpty()) options else options.filter { label(it).lowercase().contains(q) }
}

/** A new list: [item] taken off if chosen, else added at the end unless [value] already holds [max]. */
internal fun <T> toggleChoice(value: List<T>, item: T, max: Int?): List<T> = when {
    item in value -> value.filter { it != item }
    max != null && value.size >= max -> value
    else -> value + item
}

/** The row an arrow moves to among [n], wrapping; from none (-1) down is the first and up the last. */
internal fun stepRow(at: Int, delta: Int, n: Int): Int = when {
    n <= 0 -> -1
    at < 0 -> if (delta > 0) 0 else n - 1
    else -> ((at + delta) % n + n) % n
}

/**
 * Several choices from a list (`k-multi`). What is chosen sits in the field as words with a cross,
 * in the order chosen; the field is also an input, so typing narrows the glass list under it (above
 * when there is no room). Arrow keys move through the list, Enter toggles the row under the cursor,
 * Backspace on an empty input takes the last choice off, Escape, Tab, leaving the field or a tap
 * outside closes it. The list stays open while you choose. [pill] is the toolbar form: no chips and
 * no typing, a bordered button that shows the caller's [summary] ("Columns 3/7") over the same list.
 * [label] reads [options] as words and [dot] gives a colour drawn as a dot before it. [value] is
 * matched with `==` and replaced (never changed in place) on every toggle; [max] stops adding at that
 * many, a full set can still be reduced. [noMatch] shows when typing matches nothing, [removeLabel]
 * prefixes a chip's spoken name ("Remove Tashkent"), [description] is the accessible name.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun <T> KometaMulti(
    options: List<T>,
    value: List<T>,
    onValueChange: (List<T>) -> Unit,
    modifier: Modifier = Modifier,
    label: (T) -> String = { it.toString() },
    dot: (T) -> Color? = { null },
    placeholder: String = "",
    summary: String = "",
    noMatch: String = "",
    removeLabel: String = "Remove",
    pill: Boolean = false,
    max: Int? = null,
    description: String = "",
    enabled: Boolean = true,
) {
    val c = Kometa.colors
    var open by remember { mutableStateOf(false) }
    var query by remember { mutableStateOf("") }
    var act by remember { mutableIntStateOf(0) }
    var focused by remember { mutableStateOf(false) }
    var width by remember { mutableIntStateOf(0) }
    val entry = remember { FocusRequester() }
    val shown = if (pill) options else matchOptions(options, label, query)
    val at = act.coerceAtMost(shown.size - 1)
    val density = LocalDensity.current

    fun close() { open = false; act = 0 }
    fun toggle(o: T) { onValueChange(toggleChoice(value, o, max)); if (!pill) query = "" }
    val keys = Modifier.onPreviewKeyEvent { e ->
        if (e.type != KeyEventType.KeyDown) return@onPreviewKeyEvent false
        when (e.key) {
            Key.DirectionDown, Key.DirectionUp -> {
                if (!open) open = enabled
                else if (shown.isNotEmpty()) act = stepRow(at, if (e.key == Key.DirectionDown) 1 else -1, shown.size)
                true
            }
            Key.Enter, Key.NumPadEnter -> if (open && at >= 0) { toggle(shown[at]); true } else false
            Key.Backspace -> if (!pill && query.isEmpty() && value.isNotEmpty()) { onValueChange(value.dropLast(1)); true } else false
            Key.Escape -> if (open) { close(); true } else false
            Key.Tab -> { close(); false }
            else -> false
        }
    }

    Box(modifier.onSizeChanged { width = it.width }) {
        if (pill) {
            val turn by animateFloatAsState(if (open) 225f else 45f, tween(320, easing = SpringEase))
            val shape = RoundedCornerShape(50)
            Row(
                Modifier
                    .defaultMinSize(minHeight = 44.dp)
                    .alpha(if (enabled) 1f else .5f)
                    .clip(shape)
                    .background(c.glass, shape)
                    .border(1.dp, if (open) c.displayInk else c.glassLine, shape)
                    .then(keys)
                    .clickable(enabled = enabled, role = Role.DropdownList) { if (open) close() else open = true }
                    .semantics {
                        if (description.isNotEmpty()) contentDescription = description
                        if (summary.isNotEmpty()) stateDescription = summary
                    }
                    .padding(horizontal = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                BasicText(
                    summary.ifEmpty { placeholder },
                    style = Kometa.type.md.copy(
                        color = if (value.isEmpty()) c.muted else c.displayInk,
                        fontWeight = if (value.isEmpty()) FontWeight.Normal else FontWeight.SemiBold,
                    ),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Canvas(Modifier.padding(horizontal = 2.dp).size(8.dp).rotate(turn)) {
                    // The chevron of KometaSelect: an L turned 45° (down) or 225° (up), drawn a quarter back so it stays centred.
                    val w = 1.dp.toPx()
                    val e = size.width * .75f
                    val s = -size.width * .25f
                    drawLine(c.muted, Offset(e, s), Offset(e, e), w)
                    drawLine(c.muted, Offset(s, e), Offset(e, e), w)
                }
            }
        } else {
            val draw by animateFloatAsState(if (focused) 1f else 0f, tween(420, easing = SpringEase))
            val chipShape = RoundedCornerShape(50)
            val style = Kometa.type.md.copy(color = c.displayInk)
            FlowRow(
                Modifier
                    .fillMaxWidth()
                    .defaultMinSize(minHeight = 44.dp)
                    .alpha(if (enabled) 1f else .5f)
                    .underline(c.glassLine, c.displayInk, draw)
                    .pointerInput(enabled) { if (enabled) detectTapGestures { entry.requestFocus() } },
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalArrangement = Arrangement.Center,
            ) {
                value.filter { it in options }.forEach { o ->
                    Box(
                        Modifier
                            .defaultMinSize(minHeight = 44.dp)
                            .clickable(enabled = enabled, role = Role.Button) { toggle(o); entry.requestFocus() }
                            .semantics { contentDescription = "$removeLabel ${label(o)}" },
                        contentAlignment = Alignment.Center,
                    ) {
                        Row(
                            Modifier.height(30.dp).border(1.dp, c.glassLine, chipShape).padding(start = 12.dp, end = 10.dp).clearAndSetSemantics {},
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            BasicText(label(o), style = style)
                            BasicText("×", style = Kometa.type.md.copy(color = c.muted, fontSize = 16.sp))
                        }
                    }
                }
                BasicTextField(
                    value = query,
                    onValueChange = { query = it; act = 0; open = enabled },
                    modifier = Modifier
                        .weight(1f)
                        .widthIn(min = 90.dp)
                        .defaultMinSize(minHeight = 44.dp)
                        .focusRequester(entry)
                        .onFocusChanged {
                            focused = it.isFocused
                            if (it.isFocused) open = enabled else close()
                        }
                        .then(keys)
                        .semantics { if (description.isNotEmpty()) contentDescription = description },
                    enabled = enabled,
                    singleLine = true,
                    textStyle = style,
                    cursorBrush = SolidColor(c.displayInk),
                    decorationBox = { inner ->
                        Box(contentAlignment = Alignment.CenterStart) {
                            if (query.isEmpty() && value.isEmpty()) BasicText(placeholder, style = style.copy(color = c.muted), maxLines = 1)
                            inner()
                        }
                    },
                )
            }
        }

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
            // The field keeps focus while the list is open (the web's aria-activedescendant); the pill hands it to the list.
            // shortcut: in the pill's list the rows take Tab and Space but not the arrows, add per-row FocusRequesters if a keyboard flow needs it.
            // shortcut: the active row is not scrolled into view past 300dp of rows, move to a LazyColumn if lists get long.
            Popup(popupPositionProvider = place, onDismissRequest = { close() }, properties = PopupProperties(focusable = pill)) {
                val shape = RoundedCornerShape(16.dp)
                Column(
                    Modifier
                        .graphicsLayer {
                            val t = grow.value
                            scaleX = .96f + .04f * t
                            scaleY = scaleX
                            alpha = (t * 1.6f).coerceIn(0f, 1f)
                        }
                        .widthIn(min = maxOf(180.dp, with(density) { width.toDp() }))
                        .width(IntrinsicSize.Max)
                        .heightIn(max = 300.dp)
                        .clip(shape)
                        .background(c.card, shape)
                        .border(1.dp, c.glassLine, shape)
                        .verticalScroll(rememberScrollState())
                        .padding(6.dp)
                        .semantics { if (description.isNotEmpty()) paneTitle = description },
                ) {
                    if (shown.isEmpty() && noMatch.isNotEmpty()) {
                        BasicText(noMatch, Modifier.padding(12.dp, 8.dp), style = Kometa.type.md.copy(color = c.muted, fontSize = 13.5.sp))
                    }
                    shown.forEachIndexed { i, o ->
                        val on = o in value
                        Row(
                            Modifier
                                .fillMaxWidth()
                                .defaultMinSize(minHeight = 44.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (i == at && !pill) c.glassLine else Color.Transparent)
                                .toggleable(on, role = Role.Checkbox) { toggle(o) }
                                .drawBehind { if (on) drawRect(c.displayInk, size = size.copy(width = 2.dp.toPx())) }
                                .padding(horizontal = 12.dp, vertical = 9.dp),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            dot(o)?.let { Box(Modifier.size(8.dp).background(it, CircleShape)) }
                            BasicText(label(o), style = Kometa.type.md.copy(color = if (on) c.displayInk else c.text, fontSize = 15.sp))
                        }
                    }
                }
            }
        }
    }
}
