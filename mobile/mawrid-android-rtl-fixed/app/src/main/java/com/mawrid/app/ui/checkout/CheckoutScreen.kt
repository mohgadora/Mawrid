package com.mawrid.app.ui.checkout

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mawrid.app.domain.model.Address
import com.mawrid.app.ui.UiDefaults.formatFinal
import com.mawrid.app.ui.UiDefaults.formatRetail

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CheckoutScreen(
    onBack: () -> Unit,
    onLogin: () -> Unit,
    onOrderPlaced: (String) -> Unit,
    vm: CheckoutViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()

    LaunchedEffect(state.placedOrderId) {
        state.placedOrderId?.let(onOrderPlaced)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("إتمام الطلب") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "رجوع")
                    }
                },
            )
        },
        bottomBar = {
            if (state.isLoggedIn) {
                PlaceOrderBar(
                    totalLabel = formatFinal(state.payableUsd),
                    enabled = state.canPlace,
                    placing = state.placing,
                    onPlace = vm::placeOrder,
                )
            }
        },
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            if (!state.isLoggedIn) {
                LoginPrompt(onLogin)
            } else {
                Column(
                    Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
                ) {
                    SectionTitle("عنوان التوصيل")
                    AddressSection(
                        addresses = state.addresses,
                        selectedId = state.selectedAddressId,
                        onSelect = vm::selectAddress,
                        label = state.label, onLabel = vm::onLabel,
                        line1 = state.line1, onLine1 = vm::onLine1,
                        city = state.city, onCity = vm::onCity,
                        phone = state.phone, onPhone = vm::onPhone,
                        useNewAddress = state.useNewAddress,
                    )

                    Spacer(Modifier.height(20.dp))
                    SectionTitle("طريقة الدفع")
                    PaymentMethod.entries.forEach { method ->
                        Row(
                            Modifier
                                .fillMaxWidth()
                                .selectable(state.payment == method, onClick = { vm.setPayment(method) })
                                .padding(vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            RadioButton(selected = state.payment == method, onClick = { vm.setPayment(method) })
                            Text(method.labelAr, style = MaterialTheme.typography.bodyLarge)
                        }
                    }

                    Spacer(Modifier.height(20.dp))
                    SectionTitle("كوبون الخصم")
                    CouponSection(
                        code = state.couponCode,
                        onCode = vm::onCouponCode,
                        applying = state.applyingCoupon,
                        applied = state.coupon,
                        error = state.couponError,
                        onApply = vm::applyCoupon,
                        onRemove = vm::removeCoupon,
                    )

                    Spacer(Modifier.height(20.dp))
                    OrderSummary(
                        subtotalUsd = state.summary.subtotalUsd,
                        shippingUsd = state.summary.shippingUsd,
                        discountUsd = state.discountUsd,
                        freeShipping = state.coupon?.freeShipping == true,
                        payableUsd = state.payableUsd,
                        cashbackUsd = state.cashbackUsd,
                    )

                    if (state.error != null) {
                        Text(
                            state.error!!,
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(top = 8.dp),
                        )
                    }
                    Spacer(Modifier.height(80.dp))
                }
            }
        }
    }
}

@Composable
private fun AddressSection(
    addresses: List<Address>,
    selectedId: String?,
    onSelect: (String?) -> Unit,
    label: String, onLabel: (String) -> Unit,
    line1: String, onLine1: (String) -> Unit,
    city: String, onCity: (String) -> Unit,
    phone: String, onPhone: (String) -> Unit,
    useNewAddress: Boolean,
) {
    if (addresses.isNotEmpty()) {
        Row(Modifier.padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            addresses.forEach { addr ->
                FilterChip(
                    selected = selectedId == addr.id,
                    onClick = { onSelect(addr.id) },
                    label = { Text(addr.label.ifBlank { addr.city }) },
                )
            }
            FilterChip(
                selected = selectedId == null,
                onClick = { onSelect(null) },
                label = { Text("عنوان جديد") },
            )
        }
    }

    if (useNewAddress) {
        Column(Modifier.padding(top = 8.dp)) {
            Field(label, onLabel, "التسمية (المنزل/المكتب)")
            Field(line1, onLine1, "العنوان")
            Field(city, onCity, "المدينة")
            Field(phone, onPhone, "رقم الجوال")
        }
    } else {
        val addr = addresses.firstOrNull { it.id == selectedId }
        if (addr != null) {
            Card(Modifier.fillMaxWidth().padding(top = 8.dp)) {
                Column(Modifier.padding(12.dp)) {
                    Text(addr.label, fontWeight = FontWeight.Bold)
                    Text("${addr.line1}، ${addr.city}", style = MaterialTheme.typography.bodyMedium)
                    Text(addr.phone, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }
}

@Composable
private fun Field(value: String, onValueChange: (String) -> Unit, label: String) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        singleLine = true,
        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
    )
}

@Composable
private fun LoginPrompt(onLogin: () -> Unit) {
    Column(
        Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text("سجّل الدخول لإتمام الطلب", style = MaterialTheme.typography.titleMedium)
        Button(onClick = onLogin, modifier = Modifier.padding(top = 12.dp)) { Text("تسجيل الدخول") }
    }
}

@Composable
private fun SectionTitle(text: String) {
    Text(text, style = MaterialTheme.typography.titleMedium)
}

@Composable
private fun CouponSection(
    code: String,
    onCode: (String) -> Unit,
    applying: Boolean,
    applied: com.mawrid.app.domain.model.CouponValidation?,
    error: String?,
    onApply: () -> Unit,
    onRemove: () -> Unit,
) {
    val cs = MaterialTheme.colorScheme
    if (applied != null && applied.valid) {
        // Applied state: show the code + discount and a remove action.
        Card {
            Row(
                Modifier.fillMaxWidth().padding(14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column {
                    Text("تم تطبيق الكوبون ${applied.code}", fontWeight = FontWeight.Bold, color = cs.primary)
                    val detail = if (applied.freeShipping) "شحن مجاني بالكوبون"
                        else "خصم ${formatFinal(applied.discountUsd)}"
                    Text(detail, style = MaterialTheme.typography.bodySmall, color = cs.onSurfaceVariant)
                }
                androidx.compose.material3.TextButton(onClick = onRemove) { Text("إزالة") }
            }
        }
    } else {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(
                value = code,
                onValueChange = onCode,
                label = { Text("أدخل كود الكوبون") },
                singleLine = true,
                isError = error != null,
                modifier = Modifier.weight(1f),
            )
            Button(onClick = onApply, enabled = code.isNotBlank() && !applying, modifier = Modifier.padding(start = 8.dp)) {
                if (applying) {
                    CircularProgressIndicator(Modifier.height(18.dp), color = cs.onPrimary, strokeWidth = 2.dp)
                } else {
                    Text("تطبيق")
                }
            }
        }
        if (error != null) {
            Text(error, color = cs.error, style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(top = 4.dp))
        }
    }
}

@Composable
private fun OrderSummary(
    subtotalUsd: Double,
    shippingUsd: Double,
    discountUsd: Double,
    freeShipping: Boolean,
    payableUsd: Double,
    cashbackUsd: Double?,
) {
    val cs = MaterialTheme.colorScheme
    Card {
        Column(Modifier.fillMaxWidth().padding(14.dp)) {
            SummaryRow("المجموع الفرعي", formatRetail(subtotalUsd))
            SummaryRow(
                "الشحن",
                if (freeShipping) "مجاني" else formatFinal(shippingUsd),
            )
            if (discountUsd > 0) {
                SummaryRow("خصم الكوبون", "− ${formatFinal(discountUsd)}", valueColor = cs.primary)
            }
            androidx.compose.material3.HorizontalDivider(Modifier.padding(vertical = 8.dp))
            SummaryRow("الإجمالي", formatFinal(payableUsd), bold = true)
            if (cashbackUsd != null && cashbackUsd > 0) {
                Text(
                    "ستربح استرجاعاً نقدياً بقيمة ${formatFinal(cashbackUsd)}",
                    style = MaterialTheme.typography.labelSmall,
                    color = cs.primary,
                    modifier = Modifier.padding(top = 8.dp),
                )
            }
        }
    }
}

@Composable
private fun SummaryRow(
    label: String,
    value: String,
    bold: Boolean = false,
    valueColor: androidx.compose.ui.graphics.Color = MaterialTheme.colorScheme.onSurface,
) {
    Row(Modifier.fillMaxWidth().padding(vertical = 2.dp), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(
            value,
            style = if (bold) MaterialTheme.typography.titleSmall else MaterialTheme.typography.bodyMedium,
            fontWeight = if (bold) FontWeight.Bold else FontWeight.Normal,
            color = valueColor,
        )
    }
}

@Composable
private fun PlaceOrderBar(totalLabel: String, enabled: Boolean, placing: Boolean, onPlace: () -> Unit) {
    Surface(shadowElevation = 8.dp, color = MaterialTheme.colorScheme.surface) {
        Row(Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text("الإجمالي", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(totalLabel, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
            }
            Button(onClick = onPlace, enabled = enabled) {
                if (placing) {
                    CircularProgressIndicator(Modifier.height(20.dp), color = MaterialTheme.colorScheme.onPrimary, strokeWidth = 2.dp)
                } else {
                    Text("تأكيد الطلب")
                }
            }
        }
    }
}
