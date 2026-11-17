package uz.kometa.ui

import androidx.compose.runtime.Immutable
import androidx.compose.runtime.ProvidableCompositionLocal
import androidx.compose.runtime.staticCompositionLocalOf

/**
 * The words the kit says on its own (button names for screen readers, pager and reorder labels, date names), in one
 * place so an app translates them once: `KometaTheme(strings = KometaStrings(remove = "Удалить", ...))`.
 * Every component still takes its own label parameter, which wins over these. `{n}` / `{total}` are filled in.
 */
@Immutable
public data class KometaStrings(
    val actions: String = "Actions",
    val remove: String = "Remove",
    val clear: String = "Clear",
    val dismiss: String = "Dismiss",
    val done: String = "done",
    val current: String = "current",
    val previousPage: String = "Previous page",
    val nextPage: String = "Next page",
    val perPage: String = "Per page",
    val resizePanes: String = "Resize panes",
    val slide: String = "Slide",
    val move: String = "Move",
    val moveUp: String = "Move up",
    val moveDown: String = "Move down",
    val position: String = "position {n} of {total}",
    val before: String = "Before",
    val after: String = "After",
    val sort: String = "Sort",
    val ascending: String = "ascending",
    val descending: String = "descending",
    val expanded: String = "expanded",
    val collapsed: String = "collapsed",
    val more: String = "{n} more",
    val newCount: String = "{n} new",
    val photos: KometaPhotosLabels = KometaPhotosLabels(),
    val dateNames: KometaDateNames = KometaDateNames.English,
)

public val LocalKometaStrings: ProvidableCompositionLocal<KometaStrings> = staticCompositionLocalOf { KometaStrings() }
