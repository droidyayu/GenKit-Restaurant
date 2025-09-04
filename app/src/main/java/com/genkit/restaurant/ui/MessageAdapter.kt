package com.genkit.restaurant.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.genkit.restaurant.R
import com.genkit.restaurant.data.model.Message
import io.noties.markwon.Markwon
import io.noties.markwon.linkify.LinkifyPlugin
import java.text.SimpleDateFormat
import java.util.*

/**
 * RecyclerView adapter for displaying chat messages
 */
class MessageAdapter(context: android.content.Context) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    companion object {
        private const val VIEW_TYPE_USER = 1
        private const val VIEW_TYPE_AGENT = 2
    }

    private val messages = mutableListOf<Message>()
    private val timeFormat = SimpleDateFormat("h:mm a", Locale.getDefault())
    private val markwon: Markwon = Markwon.builder(context)
        .usePlugin(LinkifyPlugin.create())
        .build()

    /**
     * Update the message list and notify adapter
     */
    fun updateMessages(newMessages: List<Message>) {
        messages.clear()
        messages.addAll(newMessages)
        notifyDataSetChanged()
    }

    /**
     * Add a single message to the list
     */
    fun addMessage(message: Message) {
        messages.add(message)
        notifyItemInserted(messages.size - 1)
    }

    override fun getItemViewType(position: Int): Int {
        return if (messages[position].isFromUser) {
            VIEW_TYPE_USER
        } else {
            VIEW_TYPE_AGENT
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        val inflater = LayoutInflater.from(parent.context)
        
        return when (viewType) {
            VIEW_TYPE_USER -> {
                val view = inflater.inflate(R.layout.item_message_user, parent, false)
                UserMessageViewHolder(view)
            }
            VIEW_TYPE_AGENT -> {
                val view = inflater.inflate(R.layout.item_message_agent, parent, false)
                AgentMessageViewHolder(view)
            }
            else -> throw IllegalArgumentException("Unknown view type: $viewType")
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        val message = messages[position]
        
        when (holder) {
            is UserMessageViewHolder -> holder.bind(message)
            is AgentMessageViewHolder -> holder.bind(message)
        }
    }

    override fun getItemCount(): Int = messages.size

    /**
     * ViewHolder for user messages
     */
    inner class UserMessageViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val textViewMessage: TextView = itemView.findViewById(R.id.textViewMessage)

        fun bind(message: Message) {
            textViewMessage.text = message.content
        }
    }

    /**
     * ViewHolder for agent messages
     */
    inner class AgentMessageViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val textViewMessage: TextView = itemView.findViewById(R.id.textViewMessage)
        private val textViewAgentName: TextView = itemView.findViewById(R.id.textViewAgentName)

        fun bind(message: Message) {
            // Render markdown content
            markwon.setMarkdown(textViewMessage, message.content)

            // Show agent name if available
            if (!message.agentName.isNullOrBlank()) {
                textViewAgentName.text = getAgentDisplayName(message.agentName)
                textViewAgentName.visibility = View.VISIBLE
            } else {
                textViewAgentName.visibility = View.GONE
            }
        }

        private fun getAgentDisplayName(agentName: String?): String {
            if (agentName.isNullOrBlank()) return ""

            return when {
                agentName.contains("Chef", ignoreCase = true) -> "👨‍🍳 Chef"
                agentName.contains("Menu", ignoreCase = true) -> "📋 Menu Agent"
                agentName.contains("Order", ignoreCase = true) -> "📝 Order Agent"
                agentName.contains("Waiter", ignoreCase = true) -> "🧾 Waiter"
                agentName.contains("Kitchen", ignoreCase = true) -> "🏪 Kitchen"
                agentName.contains("Inventory", ignoreCase = true) -> "📦 Inventory"
                agentName.contains("Delivery", ignoreCase = true) -> "🚚 Delivery"
                agentName.contains("root", ignoreCase = true) -> "🤖 Assistant"
                agentName.contains("Triage", ignoreCase = true) -> "🎯 Triage"
                else -> "🤖 $agentName"
            }
        }
    }
}