package com.mawrid.app.domain.model

/** A saved delivery address. `line1` is the street line (backend field name). */
data class Address(
    val id: String,
    val label: String,
    val line1: String,
    val city: String,
    val phone: String,
    val isDefault: Boolean,
)
