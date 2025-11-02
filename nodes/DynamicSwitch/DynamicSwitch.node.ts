import type {  
	IExecuteFunctions,  
	INodeExecutionData,  
	INodeParameters,  
	INodeType,  
	INodeTypeDescription,  
	NodeParameterValue,  
} from 'n8n-workflow';  
import { NodeOperationError } from 'n8n-workflow';  
  
export class DynamicSwitch implements INodeType {  
	description: INodeTypeDescription = {  
		displayName: 'Dynamic Switch',  
		name: 'dynamicSwitch',  
		group: ['transform'],  
		version: 1,  
		icon: 'file:dynamic-switch-lofi.svg',  
		description:  
			'Single-node switch with dynamic outputs and efficient routing: maintained by Swiftwing.fr',  
		defaults: { name: 'Dynamic Switch' },  
  
		inputs: ['main'],  
  
		// IMPORTANT: Use a single literal string so TS can match the `={{${string}}}` type.  
		outputs:  
			'={{(() => { const raw = Number($parameter["numberOfOutputs"]) || 2; const count = Math.max(1, Math.min(raw, 50)); const labelsRaw = ($parameter["outputLabels"] || ""); const parts = labelsRaw.split(",").map(s => s.trim()).filter(Boolean); return Array.from({ length: count }, (_, i) => ({ type: "main", displayName: parts[i] || "Route " + i })); })() }}' as `={{${string}}}`,  
  
		properties: [  
			{  
				displayName: 'Number of Outputs',  
				name: 'numberOfOutputs',  
				type: 'number',  
				typeOptions: { minValue: 1, maxValue: 50 },  
				default: 2,  
				description:  
					'How many output branches (ports) to create. Outputs are zero-indexed.',  
			},  
			{  
				displayName: 'Output Labels',  
				name: 'outputLabels',  
				type: 'string',  
				default: '',  
				placeholder: 'Comma-separated, e.g. "Cold, Warm, Hot"',  
				description: 'Optional custom labels for each output (comma-separated).',  
			},  
			{  
				displayName: 'Mode',  
				name: 'mode',  
				type: 'options',  
				options: [  
					{  
						name: 'Expression',  
						value: 'expression',  
						description: 'Send item to the output index resolved by an expression',  
					},  
					{  
						name: 'Rules',  
						value: 'rules',  
						description: 'Send item to the output(s) whose rule(s) match',  
					},  
				],  
				default: 'rules',  
				description: 'How to determine the target output for each incoming item.',  
			},  
  
			// Mode: Expression  
			{  
				displayName: 'Output Index',  
				name: 'expressionOutput',  
				type: 'number',  
				typeOptions: { minValue: 0 },  
				displayOptions: { show: { mode: ['expression'] } },  
				default: 0,  
				description:  
					'Zero-based output index to send each item to. Expressions are supported, e.g. {{$json.routeIndex}}.',  
			},  
  
			// Mode: Rules — Shared controls  
			{  
				displayName: 'Data Type',  
				name: 'dataType',  
				type: 'options',  
				options: [  
					{ name: 'Boolean', value: 'boolean' },  
					{ name: 'Date & Time', value: 'dateTime' },  
					{ name: 'Number', value: 'number' },  
					{ name: 'String', value: 'string' },  
				],  
				displayOptions: { show: { mode: ['rules'] } },  
				default: 'number',  
				description: 'Type of data to compare in routing rules.',  
			},  
			{  
				displayName: 'Match Strategy',  
				name: 'matchStrategy',  
				type: 'options',  
				options: [  
					{ name: 'First Match', value: 'first' },  
					{ name: 'All Matches', value: 'all' },  
				],  
				displayOptions: { show: { mode: ['rules'] } },  
				default: 'first',  
				description:  
					'Whether to send to the first matching rule or to all matching rules.',  
			},  
  
			// Data type: boolean  
			{  
				displayName: 'Left Value',  
				name: 'value1Boolean',  
				type: 'boolean',  
				displayOptions: { show: { dataType: ['boolean'], mode: ['rules'] } },  
				default: false,  
			},  
			{  
				displayName: 'Routing Rules',  
				name: 'rulesBoolean',  
				placeholder: 'Add Routing Rule',  
				type: 'fixedCollection',  
				typeOptions: { multipleValues: true },  
				displayOptions: { show: { dataType: ['boolean'], mode: ['rules'] } },  
				default: {},  
				options: [  
					{  
						name: 'rules',  
						displayName: 'Boolean',  
						values: [  
							{  
								displayName: 'Operation',  
								name: 'operation',  
								type: 'options',  
								options: [  
									{ name: 'Equal', value: 'equal' },  
									{ name: 'Not Equal', value: 'notEqual' },  
								],  
								default: 'equal',  
							},  
							{  
								displayName: 'Right Value',  
								name: 'value2',  
								type: 'boolean',  
								default: false,  
							},  
							{  
								displayName: 'Output',  
								name: 'output',  
								type: 'number',  
								typeOptions: { minValue: 0 },  
								default: 0,  
								description: 'Index of the output to send matching items to.',  
							},  
						],  
					},  
				],  
			},  
  
			// Data type: dateTime  
			{  
				displayName: 'Left Value',  
				name: 'value1DateTime',  
				type: 'dateTime',  
				displayOptions: { show: { dataType: ['dateTime'], mode: ['rules'] } },  
				default: '',  
			},  
			{  
				displayName: 'Routing Rules',  
				name: 'rulesDateTime',  
				placeholder: 'Add Routing Rule',  
				type: 'fixedCollection',  
				typeOptions: { multipleValues: true },  
				displayOptions: { show: { dataType: ['dateTime'], mode: ['rules'] } },  
				default: {},  
				options: [  
					{  
						name: 'rules',  
						displayName: 'Dates',  
						values: [  
							{  
								displayName: 'Operation',  
								name: 'operation',  
								type: 'options',  
								options: [  
									{ name: 'Occurred After', value: 'after' },  
									{ name: 'Occurred Before', value: 'before' },  
								],  
								default: 'after',  
							},  
							{  
								displayName: 'Right Value',  
								name: 'value2',  
								type: 'dateTime',  
								default: '',  
							},  
							{  
								displayName: 'Output',  
								name: 'output',  
								type: 'number',  
								typeOptions: { minValue: 0 },  
								default: 0,  
							},  
						],  
					},  
				],  
			},  
  
			// Data type: number  
			{  
				displayName: 'Left Value',  
				name: 'value1Number',  
				type: 'number',  
				displayOptions: { show: { dataType: ['number'], mode: ['rules'] } },  
				default: 0,  
			},  
			{  
				displayName: 'Routing Rules',  
				name: 'rulesNumber',  
				placeholder: 'Add Routing Rule',  
				type: 'fixedCollection',  
				typeOptions: { multipleValues: true },  
				displayOptions: { show: { dataType: ['number'], mode: ['rules'] } },  
				default: {},  
				options: [  
					{  
						name: 'rules',  
						displayName: 'Numbers',  
						values: [  
							{  
								displayName: 'Operation',  
								name: 'operation',  
								type: 'options',  
								options: [  
									{ name: 'Smaller', value: 'smaller' },  
									{ name: 'Smaller Equal', value: 'smallerEqual' },  
									{ name: 'Equal', value: 'equal' },  
									{ name: 'Not Equal', value: 'notEqual' },  
									{ name: 'Larger', value: 'larger' },  
									{ name: 'Larger Equal', value: 'largerEqual' },  
								],  
								default: 'equal',  
							},  
							{  
								displayName: 'Right Value',  
								name: 'value2',  
								type: 'number',  
								default: 0,  
							},  
							{  
								displayName: 'Output',  
								name: 'output',  
								type: 'number',  
								typeOptions: { minValue: 0 },  
								default: 0,  
							},  
						],  
					},  
				],  
			},  
  
			// Data type: string  
			{  
				displayName: 'Left Value',  
				name: 'value1String',  
				type: 'string',  
				displayOptions: { show: { dataType: ['string'], mode: ['rules'] } },  
				default: '',  
			},  
			{  
				displayName: 'Case Insensitive',  
				name: 'caseInsensitive',  
				type: 'boolean',  
				default: true,  
				description: 'Ignore case when comparing strings (except regex).',  
				displayOptions: { show: { dataType: ['string'], mode: ['rules'] } },  
			},  
			{  
				displayName: 'Routing Rules',  
				name: 'rulesString',  
				placeholder: 'Add Routing Rule',  
				type: 'fixedCollection',  
				typeOptions: { multipleValues: true },  
				displayOptions: { show: { dataType: ['string'], mode: ['rules'] } },  
				default: {},  
				options: [  
					{  
						name: 'rules',  
						displayName: 'Strings',  
						values: [  
							{  
								displayName: 'Operation',  
								name: 'operation',  
								type: 'options',  
								options: [  
									{ name: 'Contains', value: 'contains' },  
									{ name: 'Not Contains', value: 'notContains' },  
									{ name: 'Ends With', value: 'endsWith' },  
									{ name: 'Not Ends With', value: 'notEndsWith' },  
									{ name: 'Equal', value: 'equal' },  
									{ name: 'Not Equal', value: 'notEqual' },  
									{ name: 'Regex Match', value: 'regex' },  
									{ name: 'Regex Not Match', value: 'notRegex' },  
									{ name: 'Starts With', value: 'startsWith' },  
									{ name: 'Not Starts With', value: 'notStartsWith' },  
								],  
								default: 'equal',  
							},  
							{  
								displayName: 'Right Value',  
								name: 'value2',  
								type: 'string',  
								default: '',  
								description:  
									'For non-regex operations. This field is ignored if operation is Regex.',  
								displayOptions: {  
									hide: { operation: ['regex', 'notRegex'] },  
								},  
							},  
							{  
								displayName: 'Regex Pattern',  
								name: 'pattern',  
								type: 'string',  
								default: '',  
								placeholder: '/text/i',  
								description:  
									'For Regex operations. Use format /pattern/flags, e.g. /text/i.',  
								displayOptions: {  
									show: { operation: ['regex', 'notRegex'] },  
								},  
							},  
							{  
								displayName: 'Output',  
								name: 'output',  
								type: 'number',  
								typeOptions: { minValue: 0 },  
								default: 0,  
							},  
						],  
					},  
				],  
			},  
  
			// Fallback (both modes)  
			{  
				displayName: 'Fallback Output',  
				name: 'fallbackOutput',  
				type: 'number',  
				typeOptions: { minValue: -1 },  
				default: -1,  
				description:  
					'Output index for items that did not match any rule (Rules mode) or invalid index (Expression mode). Use -1 to drop non-matching items.',  
				displayOptions: { show: { mode: ['rules', 'expression'] } },  
			},  
		],  
	};  
  
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {  
		const items = this.getInputData();  
  
		const numberOfOutputs = (this.getNodeParameter('numberOfOutputs', 0) as number) ?? 2;  
		const outputs: INodeExecutionData[][] = Array.from(  
			{ length: Math.max(1, Math.min(numberOfOutputs, 50)) },  
			() => [],  
		);  
  
		const mode = this.getNodeParameter('mode', 0) as string;  
  
		// Compare operations  
		const ops: Record<string, (v1: NodeParameterValue, v2: NodeParameterValue) => boolean> = {  
			after: (v1, v2) => (v1 as number) > (v2 as number),  
			before: (v1, v2) => (v1 as number) < (v2 as number),  
  
			contains: (v1, v2) => (v1 ?? '').toString().includes((v2 ?? '').toString()),  
			notContains: (v1, v2) => !(v1 ?? '').toString().includes((v2 ?? '').toString()),  
  
			endsWith: (v1, v2) => (v1 as string).endsWith(v2 as string),  
			notEndsWith: (v1, v2) => !(v1 as string).endsWith(v2 as string),  
  
			equal: (v1, v2) => v1 === v2,  
			notEqual: (v1, v2) => v1 !== v2,  
  
			larger: (v1, v2) => (Number(v1) || 0) > (Number(v2) || 0),  
			largerEqual: (v1, v2) => (Number(v1) || 0) >= (Number(v2) || 0),  
			smaller: (v1, v2) => (Number(v1) || 0) < (Number(v2) || 0),  
			smallerEqual: (v1, v2) => (Number(v1) || 0) <= (Number(v2) || 0),  
  
			startsWith: (v1, v2) => (v1 as string).startsWith(v2 as string),  
			notStartsWith: (v1, v2) => !(v1 as string).startsWith(v2 as string),  
  
			regex: (v1, v2) => {  
				const raw = (v2 ?? '').toString();  
				const match = raw.match(new RegExp('^/(.*?)/([dgimsuy]*)$'));  
				let regex: RegExp;  
				try {  
					if (!match) regex = new RegExp(raw);  
					else if (match.length === 1) regex = new RegExp(match[1]);  
					else regex = new RegExp(match[1], match[2]);  
				} catch {  
					// Invalid pattern — treat as non-match  
					return false;  
				}  
				return !!(v1 ?? '').toString().match(regex);  
			},  
			notRegex: (v1, v2) => {  
				const raw = (v2 ?? '').toString();  
				const match = raw.match(new RegExp('^/(.*?)/([dgimsuy]*)$'));  
				let regex: RegExp;  
				try {  
					if (!match) regex = new RegExp(raw);  
					else if (match.length === 1) regex = new RegExp(match[1]);  
					else regex = new RegExp(match[1], match[2]);  
				} catch {  
					// Invalid pattern — treat as match-not-found  
					return true;  
				}  
				return !(v1 ?? '').toString().match(regex);  
			},  
		};  
  
		const parseDateValue = (v: NodeParameterValue): number => {  
			if (typeof v === 'number') return v;  
			if (typeof v === 'string') {  
				const n = new Date(v).getTime();  
				if (Number.isFinite(n)) return n;  
			}  
			if (v !== null && v !== undefined && typeof v === 'object') {  
				const obj = v as Record<string, any>;  
				if ('getTime' in obj && typeof obj.getTime === 'function') {  
					const n = obj.getTime();  
					if (Number.isFinite(n)) return n;  
				}  
			}  
			throw new NodeOperationError(this.getNode(), `Invalid DateTime value: "${String(v)}"`);  
		};  
  
		const ensureRange = (idx: number, itemIndex?: number) => {  
			if (!Number.isInteger(idx) || idx < 0 || idx >= outputs.length) {  
				throw new NodeOperationError(  
					this.getNode(),  
					`Output index ${idx} is out of range. Must be between 0 and ${outputs.length - 1}.`,  
					itemIndex !== undefined ? { itemIndex } : {},  
				);  
			}  
		};  
  
		for (let i = 0; i < items.length; i++) {  
			const item = items[i];  
  
			try {  
				if (mode === 'expression') {  
					let target = this.getNodeParameter('expressionOutput', i) as number;  
					target = Math.floor(target);  
  
					if (target < 0 || target >= outputs.length) {  
						const fb = this.getNodeParameter('fallbackOutput', i) as number;  
						if (fb !== -1) {  
							const outIdx = Math.floor(fb);  
							ensureRange(outIdx, i);  
							outputs[outIdx].push(item);  
						}  
					} else {  
						ensureRange(target, i);  
						outputs[target].push(item);  
					}  
					continue;  
				}  
  
				// Mode: rules  
				const dataType = this.getNodeParameter('dataType', i) as string;  
				const matchStrategy = (this.getNodeParameter('matchStrategy', i) as string) || 'first';  
  
				let left: NodeParameterValue;  
				if (dataType === 'boolean') {  
					left = this.getNodeParameter('value1Boolean', i) as NodeParameterValue;  
				} else if (dataType === 'dateTime') {  
					left = this.getNodeParameter('value1DateTime', i) as NodeParameterValue;  
					left = parseDateValue(left);  
				} else if (dataType === 'number') {  
					left = this.getNodeParameter('value1Number', i) as NodeParameterValue;  
				} else {  
					left = this.getNodeParameter('value1String', i) as NodeParameterValue;  
				}  
  
				const rulesPathByType: Record<string, string> = {  
					boolean: 'rulesBoolean.rules',  
					dateTime: 'rulesDateTime.rules',  
					number: 'rulesNumber.rules',  
					string: 'rulesString.rules',  
				};  
				const rulesPath = rulesPathByType[dataType];  
				const rules = this.getNodeParameter(rulesPath, i, []) as INodeParameters[];  
  
				let matched = false;  
  
				for (const rule of rules) {  
					const op = rule.operation as string;  
  
					let right: NodeParameterValue;  
					if (dataType === 'string' && (op === 'regex' || op === 'notRegex')) {  
						right = (rule as any).pattern as NodeParameterValue;  
					} else {  
						right = (rule as any).value2 as NodeParameterValue;  
					}  
  
					if (dataType === 'dateTime') {  
						right = parseDateValue(right);  
					}  
  
					let l = left;  
					let r = right;  
  
					if (dataType === 'string') {  
						const ci = this.getNodeParameter('caseInsensitive', i, true) as boolean;  
						const isRegex = op === 'regex' || op === 'notRegex';  
						if (ci && !isRegex) {  
							l = (l ?? '').toString().toLowerCase();  
							r = (r ?? '').toString().toLowerCase();  
						}  
					}  
  
					const fn = ops[op];  
					if (typeof fn !== 'function') {  
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${op}`, {  
							itemIndex: i,  
						});  
					}  
  
					const ok = fn(l, r);  
  
					if (ok) {  
						const outIdx = Math.floor(rule.output as number);  
						ensureRange(outIdx, i);  
						outputs[outIdx].push(item);  
						matched = true;  
						if (matchStrategy === 'first') break;  
					}  
				}  
  
				if (!matched) {  
					const fb = this.getNodeParameter('fallbackOutput', i) as number;  
					if (fb !== -1) {  
						const outIdx = Math.floor(fb);  
						ensureRange(outIdx, i);  
						outputs[outIdx].push(item);  
					}  
				}  
			} catch (error) {  
				if (this.continueOnFail()) {  
					if (!outputs.length) return [[]];  
					outputs[0].push({  
						json: { error: (error as Error).message },  
						pairedItem: { item: i },  
					});  
					continue;  
				}  
				throw error;  
			}  
		}  
  
		return outputs;  
	}  
}  