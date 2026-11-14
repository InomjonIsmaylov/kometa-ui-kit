package uz.kometa.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

/** 1, the current page and its neighbours, and the last, with `null` for each gap that hides two or more. */
internal fun pageWindow(page: Int, count: Int): List<Int?> {
    val keep = listOf(1, count, page - 1, page, page + 1).filter { it in 1..count }.distinct().sorted()
    val out = mutableListOf<Int?>()
    var last = 0
    for (n in keep) {
        if (n - last == 2) out += last + 1 else if (n - last > 2) out += null
        out += n
        last = n
    }
    return out
}

/** The "1–25 / 134" caption for the rows on [page]. */
internal fun pagerCaption(total: Int, page: Int, pageSize: Int): String {
    val from = if (total <= 0) 0 else (page - 1) * pageSize + 1
    return "$from–${minOf(total, page * pageSize)} / $total"
}

/**
 * The pager (`k-pager`): a mono caption "1–25 / 134", page numbers as words with a 2dp cream line under
 * the current one ("‹ 1 2 3 … 9 ›"), and a rows-per-page words group. Under 560dp of its own width only
 * "‹ 2 / 9 ›" and the caption stay. Draws nothing when [total] fits the smallest of [sizes], so a short
 * list shows no pager at all.
 *
 * [page] is 1-based; a [page] beyond the last is pulled back through [onPageChange], and picking a size
 * also sets [page] to 1. Pass an empty [sizes] for no rows-per-page group (the hide threshold is then
 * [pageSize]); a single size draws no group either. The words default to English; pass your own.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun KometaPager(
    total: Int,
    page: Int,
    onPageChange: (Int) -> Unit,
    pageSize: Int,
    onPageSizeChange: (Int) -> Unit,
    modifier: Modifier = Modifier,
    sizes: List<Int> = listOf(10, 25, 50),
    caption: Boolean = true,
    prevLabel: String = "Previous page",
    nextLabel: String = "Next page",
    perPageLabel: String = "Per page",
) {
    val count = pageCountOf(total, pageSize)
    val current = page.coerceIn(1, count)
    // A list that shrank under the reader (a delete on the last page) pulls the page back.
    LaunchedEffect(page, current) { if (page != current) onPageChange(current) }
    if (total <= (sizes.minOrNull() ?: pageSize)) return

    val c = Kometa.colors
    val text = Kometa.type.body.copy(color = c.muted)
    val mono = Kometa.type.mono.copy(color = c.muted, fontSize = 11.sp, letterSpacing = .02.em)
    fun go(n: Int) { n.coerceIn(1, count).let { if (it != current) onPageChange(it) } }

    // shortcut: no `nav` landmark name or `<html lang>` words (Compose has neither), pass the labels in your language.
    BoxWithConstraints(modifier.fillMaxWidth()) {
        val narrow = maxWidth < 560.dp
        FlowRow(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            if (caption) BasicText(pagerCaption(total, current, pageSize), Modifier.align(Alignment.CenterVertically), style = mono)
            Row(verticalAlignment = Alignment.CenterVertically) {
                PagerWord("‹", text.copy(fontSize = 16.sp), enabled = current > 1, label = prevLabel) { go(current - 1) }
                if (narrow) BasicText(
                    "$current / $count",
                    Modifier.widthIn(min = 56.dp).clearAndSetSemantics {},
                    style = mono.copy(textAlign = TextAlign.Center),
                )
                else pageWindow(current, count).forEach { p ->
                    if (p == null) BasicText("…", Modifier.padding(horizontal = 4.dp).alpha(.6f).clearAndSetSemantics {}, style = text)
                    else PagerWord("$p", text, on = p == current) { go(p) }
                }
                PagerWord("›", text.copy(fontSize = 16.sp), enabled = current < count, label = nextLabel) { go(current + 1) }
            }
            if (!narrow && sizes.size > 1) Row(
                Modifier.semantics { contentDescription = perPageLabel },
                verticalAlignment = Alignment.CenterVertically,
            ) {
                BasicText(perPageLabel, Modifier.padding(end = 8.dp).clearAndSetSemantics {}, style = text.copy(fontSize = 11.sp))
                sizes.forEach { s ->
                    PagerWord("$s", text, on = s == pageSize) {
                        if (s != pageSize) { onPageSizeChange(s); onPageChange(1) }
                    }
                }
            }
        }
    }
}

/** A page number, arrow or size: a bare word, a cream 2dp line under it when [on]. */
@Composable
private fun PagerWord(
    word: String,
    style: androidx.compose.ui.text.TextStyle,
    on: Boolean = false,
    enabled: Boolean = true,
    label: String = "",
    onClick: () -> Unit,
) {
    val c = Kometa.colors
    val source = remember { MutableInteractionSource() }
    val hovered by source.collectIsHoveredAsState()
    val ink by animateColorAsState(if (on || (hovered && enabled)) c.text else c.muted, tween(200))
    Box(
        Modifier
            .defaultMinSize(44.dp, 44.dp)
            .alpha(if (enabled) 1f else .35f)
            .clickable(source, indication = null, enabled = enabled, role = Role.Button, onClick = onClick)
            .semantics {
                if (label.isNotEmpty()) contentDescription = label
                if (on) selected = true
            }
            .drawBehind {
                if (!on) return@drawBehind
                val h = 2.dp.toPx()
                drawLine(c.displayInk, Offset(0f, size.height - h / 2), Offset(size.width, size.height - h / 2), h)
            }
            .padding(horizontal = 8.dp),
        contentAlignment = Alignment.Center,
    ) {
        BasicText(word, style = style.copy(color = ink))
    }
}
