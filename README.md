# n8n-nodes-dynamic-switch

This is an n8n community node that **fixes what the n8n's built-in Switch node should have been** by allowing **up to 50 dynamic outputs** instead of being limited to a fixed number of outputs. It lets you add a Dynamic Switch node to your n8n workflows to route items across multiple outputs based on expressions or rule-based comparisons—with far greater flexibility than the standard Switch node.  
  
[n8n](https://n8n.io/) is a fair-code licensed workflow automation platform.  
  
[Installation](#installation)   [Operations](#operations)   [Credentials](#credentials)   [Compatibility](#compatibility)   [Usage](#usage)   [Resources](#resources)
  
## Installation  
  
Follow the installation guide in the n8n community nodes documentation:  
https://docs.n8n.io/integrations/community-nodes/installation/  
  
You can also install directly from within n8n:  
- Settings → Community nodes → Install  
- Search or enter the package name: `n8n-nodes-dynamic-switch`  
- Install and trust the package  
  
## Operations

The Dynamic Switch is a transform node that **fixes what the n8n's built-in Switch node should have been** by allowing you to **dynamically configure 1–50 outputs** at runtime, rather than being limited to a fixed number. You control the number of outputs, labels, and routing mode with much greater flexibility.

Key parameters:
- **Number of Outputs**: Configure anywhere from 1 to 50 output ports dynamically (far exceeding the standard Switch node's limit).  
- Output Labels: optional comma-separated labels for ports; falls back to “Route 0..N”.  
- Mode:  
  - Expression: send an item to a zero-based output index, which can be an expression (e.g., `{{$json.routeIndex}}`).  
  - Rules: evaluate comparisons against a left value and route based on matching rules.  
- Fallback Output: optional index for items that don’t match any rule (or have an invalid expression index). Use -1 to drop such items.  
- Match Strategy (Rules mode): First Match (default) or All Matches.  
- Case Insensitive (String rules): toggle case-insensitive comparisons (except regex).  
  
Supported rule types and operations:  
  
- Boolean  
  - Equal, Not Equal  
- Number  
  - Smaller, Smaller Equal, Equal, Not Equal, Larger, Larger Equal  
- String  
  - Contains, Not Contains, Ends With, Not Ends With, Equal, Not Equal, Regex Match, Regex Not Match, Starts With, Not Starts With  
  - Optional case-insensitive comparisons (except regex)  
- Date & Time  
  - Occurred After, Occurred Before  
  - Dates are parsed to timestamps for comparison  
  
## Credentials  
  
No authentication is required for this node.  
  
## Compatibility  
  
- Requires n8n versions that support Community Nodes and n8n Nodes API v1 (for example, n8n 1.60.0 or later).  
- Built with @n8n/node-cli and TypeScript.  
- Node.js 18+ recommended (n8n generally supports Node 18 or 20).  
  
If you encounter issues on older n8n versions, update n8n to a recent release and rebuild this package.  
  
## Usage  
  
Basic steps:  
1) Add the “Dynamic Switch” node to your workflow.  
2) Set Number of Outputs (for example, 4).  
3) (Optional) Set Output Labels, for example: `Cold, Warm, Hot, Critical`.  
4) Choose Mode:  
   - Expression:  
     - Set Output Index to a number or expression. Example: `{{$json.priority}}`  
     - If the expression returns an out-of-range index, the node uses Fallback Output (if set).  
   - Rules:  
     - Choose Data Type (Boolean / Number / String / Date & Time).  
     - Set Left Value (can be entered directly or via expression).  
     - Add one or more rules. Each rule has an Operation, Right Value, and Output index.  
     - Select Match Strategy:  
       - First Match: route to only the first output whose rule matches (efficient, default).  
       - All Matches: send the item to every output whose rule matches.  
     - Optionally set Fallback Output for non-matching items.  
5) Connect each output to the desired branch(es). Items are pushed only to their routed output(s), so no downstream filtering is required.  
  
Example (Rules mode):  
- Number of Outputs: 3  
- Output Labels: `Low, Medium, High`  
- Data Type: Number  
- Left Value: `{{$json.score}}`  
- Rules:  
  - If Smaller than 50 → Output 0 (Low)  
  - If Smaller than 80 → Output 1 (Medium)  
  - If Larger Equal 80 → Output 2 (High)  
- Match Strategy: First Match  
- Fallback Output: -1 (drop)  
  
Example (Expression mode):  
- Number of Outputs: 4  
- Output Index: `{{$json.routeIndex}}` (expects 0..3)  
- Fallback Output: 0  
  
## Resources  
  
- n8n community nodes documentation: https://docs.n8n.io/integrations/#community-nodes  
- n8n expressions guide: https://docs.n8n.io/code-examples/expressions/  
- Source repository (issues and contributions): https://github.com/swiftwing-dev/n8n-nodes-dynamic-switch  
  

## License  
MIT  

## Author  
Built and maintained by Swiftwing (https://swiftwing.fr)  
