import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calculator as CalculatorIcon, History, Trash2, Copy, XIcon } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function FloatingCalculator({ onClose }) {
    const [display, setDisplay] = useState('0');
    const [previousValue, setPreviousValue] = useState(null);
    const [operation, setOperation] = useState(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);
    const [memory, setMemory] = useState(0);
    const [history, setHistory] = useState([]);
    const { toast } = useToast();

    // Load history from localStorage on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem('calculator-history');
        if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
        }
    }, []);

    // Save history to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('calculator-history', JSON.stringify(history));
    }, [history]);

    const calculate = useCallback((firstValue, secondValue, operation) => {
        let result;
        
        switch (operation) {
            case '+':
                result = firstValue + secondValue;
                break;
            case '-':
                result = firstValue - secondValue;
                break;
            case '*':
                result = firstValue * secondValue;
                break;
            case '/':
                result = secondValue !== 0 ? firstValue / secondValue : 0;
                break;
            default:
                return secondValue;
        }

        const calculation = `${firstValue} ${operation} ${secondValue} = ${result}`;
        setHistory(prev => [calculation, ...prev.slice(0, 9)]);
        return result;
    }, []);

    const inputNumber = useCallback((num) => {
        if (waitingForOperand) {
            setDisplay(String(num));
            setWaitingForOperand(false);
        } else {
            setDisplay(display === '0' ? String(num) : display + num);
        }
    }, [display, waitingForOperand]);

    const inputDecimal = useCallback(() => {
        if (waitingForOperand) {
            setDisplay('0.');
            setWaitingForOperand(false);
        } else if (display.indexOf('.') === -1) {
            setDisplay(display + '.');
        }
    }, [display, waitingForOperand]);

    const performOperation = useCallback((nextOperation) => {
        const inputValue = parseFloat(display);

        if (previousValue === null) {
            setPreviousValue(inputValue);
        } else if (operation) {
            const currentValue = previousValue || 0;
            const newValue = calculate(currentValue, inputValue, operation);
            setDisplay(String(newValue));
            setPreviousValue(newValue);
        }

        setWaitingForOperand(true);
        setOperation(nextOperation);
    }, [display, previousValue, operation, calculate]);

    const clearAll = useCallback(() => {
        setDisplay('0');
        setPreviousValue(null);
        setOperation(null);
        setWaitingForOperand(false);
    }, []);

    const clearEntry = useCallback(() => {
        setDisplay('0');
    }, []);

    const handleCalculate = useCallback(() => {
        const inputValue = parseFloat(display);
        if (previousValue !== null && operation) {
            const newValue = calculate(previousValue, inputValue, operation);
            setDisplay(String(newValue));
            setPreviousValue(null);
            setOperation(null);
            setWaitingForOperand(true);
        }
    }, [display, previousValue, operation, calculate]);

    // Keyboard support
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            const key = e.key;
            
            if (key >= '0' && key <= '9') inputNumber(key);
            else if (key === '.') inputDecimal();
            else if (['+', '-', '*', '/'].includes(key)) performOperation(key);
            else if (key === 'Enter' || key === '=') { e.preventDefault(); handleCalculate(); }
            else if (key === 'Escape') onClose();
            else if (key === 'Backspace') clearEntry();
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [inputNumber, inputDecimal, performOperation, handleCalculate, clearAll, clearEntry, onClose]);

    const memoryRecall = () => setDisplay(String(memory));
    const memoryClear = () => setMemory(0);
    const memoryAdd = () => setMemory(memory + parseFloat(display));
    const memorySubtract = () => setMemory(memory - parseFloat(display));
    const percentage = () => setDisplay(String(parseFloat(display) / 100));
    const squareRoot = () => setDisplay(String(Math.sqrt(parseFloat(display))));

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="dialog-content p-0 border-0 bg-transparent shadow-2xl w-auto max-w-sm">
                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-foreground flex items-center gap-2 text-base">
                            <CalculatorIcon className="w-5 h-5" />
                            Calculator
                        </CardTitle>
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
                            <XIcon className="w-4 h-4"/>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="bg-background border border-border rounded-lg p-3 mb-4">
                            <div className="text-right text-3xl font-mono text-foreground break-all h-10">
                                {display}
                            </div>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            <Button variant="outline" onClick={memoryClear}>MC</Button>
                            <Button variant="outline" onClick={memoryRecall}>MR</Button>
                            <Button variant="outline" onClick={memoryAdd}>M+</Button>
                            <Button variant="outline" onClick={memorySubtract}>M-</Button>
                            <Button variant="outline" onClick={squareRoot}>√</Button>
                            <Button variant="outline" onClick={clearAll}>C</Button>
                            <Button variant="outline" onClick={clearEntry}>CE</Button>
                            <Button variant="outline" onClick={percentage}>%</Button>
                            <Button variant="outline" onClick={() => performOperation('/')}>÷</Button>
                            <Button variant="outline" onClick={() => setDisplay(display.slice(0, -1) || '0')}>⌫</Button>
                            <Button onClick={() => inputNumber('7')}>7</Button>
                            <Button onClick={() => inputNumber('8')}>8</Button>
                            <Button onClick={() => inputNumber('9')}>9</Button>
                            <Button variant="outline" onClick={() => performOperation('*')}>×</Button>
                            <Button variant="outline" onClick={() => setDisplay(display.includes('-') ? display.substring(1) : '-' + display)}>±</Button>
                            <Button onClick={() => inputNumber('4')}>4</Button>
                            <Button onClick={() => inputNumber('5')}>5</Button>
                            <Button onClick={() => inputNumber('6')}>6</Button>
                            <Button variant="outline" onClick={() => performOperation('-')}>−</Button>
                            <Button variant="outline" onClick={() => setDisplay(String(1 / parseFloat(display)))}>1/x</Button>
                            <Button onClick={() => inputNumber('1')}>1</Button>
                            <Button onClick={() => inputNumber('2')}>2</Button>
                            <Button onClick={() => inputNumber('3')}>3</Button>
                            <Button variant="outline" onClick={() => performOperation('+')} className="row-span-2">+</Button>
                            <Button onClick={handleCalculate} className="bg-primary text-primary-foreground hover:bg-primary/90 row-span-2">=</Button>
                            <Button onClick={() => inputNumber('0')} className="col-span-2">0</Button>
                            <Button onClick={inputDecimal}>.</Button>
                        </div>
                    </CardContent>
                </Card>
            </DialogContent>
        </Dialog>
    );
}